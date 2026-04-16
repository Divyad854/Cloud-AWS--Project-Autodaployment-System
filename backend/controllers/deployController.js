const { v4: uuidv4 } = require('uuid');
const { dynamo, TABLES } = require('../config/dynamo');
const { sqs } = require('../config/aws');
const { auditLog } = require('../utils/audit');
const logger = require('../utils/logger');

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

const getUserEmail = (req) => req.user?.email || req.user?.['cognito:username'] || null;

exports.deploy = async (req, res, next) => {
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
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (port && (!Number.isInteger(portNumber) || portNumber <= 0)) {
      return res.status(400).json({ message: 'Invalid port number' });
    }

    const projectId = uuidv4();
    const source = 'github';
    const sourceLocation = githubUrl;
    const runtimeHost = resolveRuntimeHost(runtime);

    const projectItem = {
      partitionid: projectId,
      id: projectId,
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
      status: 'queued',
      createdAt: new Date().toISOString(),
      userEmail,
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
        projectId,
        repoUrl: sourceUrl,
        runtime,
        backendPort: portNumber,
        env,
      }),
    }).promise();

    await auditLog(userId, 'DEPLOY', projectId, { name, runtime, githubUrl });

    const deployUrl = `http://${runtimeHost}:${projectItem.port}`;

    res.json({
      message: 'Deployment queued',
      projectId,
      deployUrl,
    });
  } catch (err) {
    logger.error('DEPLOY CONTROLLER ERROR:', err);
    next(err);
  }
};
