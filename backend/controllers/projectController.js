// controllers/projectController.js
const crypto = require("crypto");
const { v4: uuidv4 } = require('uuid');
const { dynamo, TABLES } = require('../config/dynamo');
const { s3, sqs, cloudwatch } = require('../config/aws');
const logger = require('../utils/logger');
const { auditLog } = require('../utils/audit');

const resolveRuntimeHost = (runtime) => {
  return process.env.EC2_HOST || '13.234.213.244';
};

const getUserId = (req) => {
  const userId = req.user?.sub;
  if (!userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return userId;
};

const findProjectById = async (projectId) => {
  const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { projectid: projectId } }).promise();
  if (result.Item) return result.Item;

  const scanResult = await dynamo.scan({
    TableName: TABLES.PROJECTS,
    FilterExpression: '#pid = :projectId OR #id = :projectId OR #partitionid = :projectId',
    ExpressionAttributeNames: {
      '#pid': 'projectid',
      '#id': 'id',
      '#partitionid': 'partitionid',
    },
    ExpressionAttributeValues: {
      ':projectId': projectId,
    },
    Limit: 1,
  }).promise();
  return scanResult.Items?.[0];
};

const resolveProjectKey = (project) => {
  if (!project) return null;
  if (project.projectid) return { projectid: project.projectid };
  if (project.id) return { projectid: project.id };
  if (project.partitionid) return { projectid: project.partitionid };
  return null;
};

const getUserEmail = (req) => req.user?.email || req.user?.['cognito:username'] || '';

exports.listProjects = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    let result;
    try {
      result = await dynamo.query({
        TableName: TABLES.PROJECTS,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      }).promise();
    } catch (queryErr) {
      if (
        queryErr.code === 'ValidationException' ||
        queryErr.message?.includes('userId-index') ||
        queryErr.message?.includes('index')
      ) {
        result = await dynamo.scan({
          TableName: TABLES.PROJECTS,
          FilterExpression: 'userId = :uid',
          ExpressionAttributeValues: { ':uid': userId },
        }).promise();
      } else {
        throw queryErr;
      }
    }

    res.json({ projects: result.Items || [] });
  } catch (err) { next(err); }
};

exports.getProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const project = await findProjectById(req.params.id);
    if (!project || project.userId !== userId) return res.status(404).json({ message: 'Project not found' });
    res.json({ project });
  } catch (err) { next(err); }
};

exports.deployProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);

    const {
      name,
      runtime,
      githubUrl,
      repoUrl,
      branch = 'main',
      port,
      backendPort,
      env = '',
    } = req.body;
    const sourceUrl = githubUrl || repoUrl;
    const portNumber = backendPort ? Number(backendPort) : port ? Number(port) : 5000;

    if (!name || !runtime || !sourceUrl) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (port && (!Number.isInteger(portNumber) || portNumber <= 0)) {
      return res.status(400).json({ message: 'Invalid port number' });
    }

    const projectId = uuidv4();
    const source = 'github';
    const sourceLocation = githubUrl;
    const runtimeHost = resolveRuntimeHost(runtime);

    // 🔥 SAVE PROJECT TO DYNAMODB
    const projectItem = {
      projectid: projectId,
      userId,
      name,
      runtime,
      runtimeHost,
      source,
      sourceLocation,
      githubUrl: sourceUrl,
      branch,
      port: portNumber,
      env,
      imageTag: projectId,
      status: "queued",
      createdAt: new Date().toISOString(),
    };

    await dynamo.put({
      TableName: TABLES.PROJECTS,
      Item: projectItem,
    }).promise();

    if (!process.env.SQS_QUEUE_URL) {
      throw new Error('SQS_QUEUE_URL is not configured');
    }

    await sqs.sendMessage({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        action: 'deploy',
        projectId,
        project: projectItem,
      }),
    }).promise();

    await auditLog(userId, "DEPLOY", projectId, { name, runtime, githubUrl });

    res.json({
      message: "Deployment queued",
      projectId,
      runtimeHost,
      deployUrl: `http://${runtimeHost}:${projectItem.port}`,
    });

  } catch (err) {
    logger.error("DEPLOY ERROR:", err);
    next(err);
  }
};

exports.redeployProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const project = await findProjectById(req.params.id);
    if (!project || project.userId !== userId) return res.status(404).json({ message: 'Not found' });

    if (!process.env.SQS_QUEUE_URL) {
      throw new Error('SQS_QUEUE_URL is not configured');
    }

    await sqs.sendMessage({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        action: 'redeploy',
        projectId: project.id,
        project,
      }),
    }).promise();

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: resolveProjectKey(project),
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'building' },
    }).promise();

    await auditLog(userId, 'REDEPLOY', req.params.id, {});
    res.json({ message: 'Redeployment queued' });
  } catch (err) { next(err); }
};

exports.stopProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const project = await findProjectById(req.params.id);
    if (!project || project.userId !== userId) return res.status(404).json({ message: 'Not found' });

    // Call EC2 runtime manager via HTTP
    const runtimeHost = project.runtimeHost || resolveRuntimeHost(project.runtime);
    await callRuntimeManager('stop', req.params.id, runtimeHost);

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: resolveProjectKey(project),
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'stopped' },
    }).promise();

    await auditLog(userId, 'STOP', req.params.id, {});
    res.json({ message: 'Project stopped' });
  } catch (err) { next(err); }
};

exports.restartProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const project = await findProjectById(req.params.id);
    if (!project || project.userId !== userId) return res.status(404).json({ message: 'Not found' });

    const runtimeHost = project.runtimeHost || resolveRuntimeHost(project.runtime);
    await callRuntimeManager('restart', req.params.id, runtimeHost);

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: resolveProjectKey(project),
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'running' },
    }).promise();

    await auditLog(userId, 'RESTART', req.params.id, {});
    res.json({ message: 'Project restarted' });
  } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const project = await findProjectById(req.params.id);
    if (!project || project.userId !== userId) return res.status(404).json({ message: 'Not found' });

    const runtimeHost = project.runtimeHost || resolveRuntimeHost(project.runtime);
    try { await callRuntimeManager('stop', req.params.id, runtimeHost); } catch {}
    await dynamo.delete({ TableName: TABLES.PROJECTS, Key: resolveProjectKey(project) }).promise();
    await auditLog(userId, 'DELETE', req.params.id, { name: project.name });
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
};

exports.getBuildLogs = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const project = await findProjectById(req.params.id);
    if (!project || project.userId !== userId) return res.status(404).json({ message: 'Not found' });

    const logGroupName = process.env.BUILD_LOG_GROUP || '/cloudlaunch/build';
    if (!logGroupName) {
      return res.json({
        logs: 'Build logs are unavailable. Set BUILD_LOG_GROUP in the environment or check CloudWatch manually.',
      });
    }

    const logStreamName = req.params.id;
    try {
      const logsResult = await cloudwatch.getLogEvents({
        logGroupName,
        logStreamName,
        limit: 200,
        startFromHead: true,
      }).promise();
      const logs = logsResult.events?.map(e => e.message).join('') || 'No build logs yet.';
      res.json({ logs });
    } catch (error) {
      logger.warn('Build log fetch failed', error.message || error);
      res.json({ logs: 'Build logs are not available yet or the log stream does not exist.' });
    }
  } catch (err) { next(err); }
};

exports.getRuntimeLogs = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const project = await findProjectById(req.params.id);
    if (!project || project.userId !== userId) return res.status(404).json({ message: 'Not found' });

    const logGroupName = `/cloudlaunch/containers`;
    const logStreamName = req.params.id;
    try {
      const logsResult = await cloudwatch.getLogEvents({
        logGroupName, logStreamName, limit: 200,
      }).promise();
      const logs = logsResult.events?.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.message}`).join('') || 'No runtime logs yet.';
      res.json({ logs });
    } catch {
      res.json({ logs: 'Runtime logs not available. Container may not be running.' });
    }
  } catch (err) { next(err); }
};

async function callRuntimeManager(action, projectId, runtimeHost) {
  const fetch = require('node-fetch');
  const host = runtimeHost || process.env.EC2_HOST || 'deploy';
  const url = `http://${host}:8080/container/${action}/${projectId}`;
  const response = await fetch(url, { method: 'POST', timeout: 10000 });
  if (!response.ok) throw new Error(`Runtime manager error: ${response.status}`);
  return response.json();
}
