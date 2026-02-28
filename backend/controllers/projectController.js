// controllers/projectController.js
const crypto = require("crypto");
const { uploadZipToS3 } = require("../aws/s3");
const { v4: uuidv4 } = require('uuid');
const { dynamo, TABLES } = require('../config/dynamo');
const { s3, codebuild, cloudwatch } = require('../config/aws');
const logger = require('../utils/logger');
const { auditLog } = require('../utils/audit');

const getUserId = (req) => req.auth.sub;
const getUserEmail = (req) => req.auth.email || req.auth['cognito:username'];

exports.listProjects = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await dynamo.query({
      TableName: TABLES.PROJECTS,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }).promise();
    res.json({ projects: result.Items || [] });
  } catch (err) { next(err); }
};

exports.getProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    if (!result.Item || result.Item.userId !== userId) return res.status(404).json({ message: 'Project not found' });
    res.json({ project: result.Item });
  } catch (err) { next(err); }
};

exports.deployProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);

    const { name, runtime, source, port, githubUrl, branch } = req.body;

    if (!name || !runtime || !source) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const projectId = uuidv4();
    const imageTag = projectId;
    let sourceLocation = null;

    // 🔥 HANDLE ZIP SOURCE
    if (source === "zip") {
      if (!req.file) {
        return res.status(400).json({ message: "ZIP file required" });
      }

      sourceLocation = await uploadZipToS3(req.file.buffer, projectId);
    }

    // 🔥 HANDLE GITHUB SOURCE
    if (source === "github") {
      if (!githubUrl) {
        return res.status(400).json({ message: "GitHub URL required" });
      }
      sourceLocation = githubUrl;
    }

    // 🔥 SAVE PROJECT TO DYNAMODB
    const projectItem = {
      id: projectId,
      userId,
      name,
      runtime,
      source,
      sourceLocation,
      githubUrl: githubUrl || null,
      branch: branch || "main",
      port: port || 3000,
      imageTag,
      status: "building",
      createdAt: new Date().toISOString(),
    };

    await dynamo.put({
      TableName: TABLES.PROJECTS,
      Item: projectItem,
    }).promise();

    // 🔥 TRIGGER CODEBUILD
    const buildSource =
      source === "github"
        ? { type: "GITHUB", location: githubUrl }
        : { type: "S3", location: sourceLocation };

    await codebuild.startBuild({
      projectName: process.env.CODEBUILD_PROJECT,
      sourceOverride: buildSource,
      environmentVariablesOverride: [
        { name: "PROJECT_ID", value: projectId },
        { name: "IMAGE_TAG", value: imageTag },
        { name: "RUNTIME", value: runtime },
        { name: "APP_PORT", value: String(port || 3000) },
        { name: "ECR_REGISTRY", value: process.env.ECR_REGISTRY },
        { name: "ECR_REPO", value: process.env.ECR_REPOSITORY },
      ],
    }).promise();

    await auditLog(userId, "DEPLOY", projectId, { name });

    res.json({
      message: "Deployment started",
      projectId,
    });

  } catch (err) {
    logger.error("DEPLOY ERROR:", err);
    next(err);
  }
};

exports.redeployProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    if (!result.Item || result.Item.userId !== userId) return res.status(404).json({ message: 'Not found' });

    const project = result.Item;
    const buildSource = project.source === 'github'
      ? { type: 'GITHUB', location: project.githubUrl }
      : { type: 'S3', location: project.sourceLocation };

    await codebuild.startBuild({
      projectName: process.env.CODEBUILD_PROJECT,
      sourceOverride: buildSource,
      environmentVariablesOverride: [
        { name: 'PROJECT_ID', value: project.id },
        { name: 'IMAGE_TAG', value: project.imageTag },
        { name: 'RUNTIME', value: project.runtime },
        { name: 'APP_PORT', value: project.port },
        { name: 'ECR_REGISTRY', value: process.env.ECR_REGISTRY },
        { name: 'ECR_REPO', value: process.env.ECR_REPOSITORY },
      ],
    }).promise();

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: { id: req.params.id },
      UpdateExpression: 'set #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'building' },
    }).promise();

    await auditLog(userId, 'REDEPLOY', req.params.id, {});
    res.json({ message: 'Redeployment started' });
  } catch (err) { next(err); }
};

exports.stopProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    if (!result.Item || result.Item.userId !== userId) return res.status(404).json({ message: 'Not found' });

    // Call EC2 runtime manager via HTTP
    await callRuntimeManager('stop', req.params.id);

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: { id: req.params.id },
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
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    if (!result.Item || result.Item.userId !== userId) return res.status(404).json({ message: 'Not found' });

    await callRuntimeManager('restart', req.params.id);

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: { id: req.params.id },
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
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    if (!result.Item || result.Item.userId !== userId) return res.status(404).json({ message: 'Not found' });

    try { await callRuntimeManager('stop', req.params.id); } catch {}
    await dynamo.delete({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    await auditLog(userId, 'DELETE', req.params.id, { name: result.Item.name });
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
};

exports.getBuildLogs = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    if (!result.Item || result.Item.userId !== userId) return res.status(404).json({ message: 'Not found' });

    const logGroupName = `/aws/codebuild/${process.env.CODEBUILD_PROJECT}`;
    const logStreamName = `${req.params.id}/build`;
    try {
      const logsResult = await cloudwatch.getLogEvents({
        logGroupName, logStreamName, limit: 200, startFromHead: true,
      }).promise();
      const logs = logsResult.events?.map(e => e.message).join('') || 'No build logs yet.';
      res.json({ logs });
    } catch {
      res.json({ logs: 'Build logs not available yet. Deployment may still be in progress.' });
    }
  } catch (err) { next(err); }
};

exports.getRuntimeLogs = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await dynamo.get({ TableName: TABLES.PROJECTS, Key: { id: req.params.id } }).promise();
    if (!result.Item || result.Item.userId !== userId) return res.status(404).json({ message: 'Not found' });

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

async function callRuntimeManager(action, projectId) {
  const fetch = require('node-fetch');
  const url = `http://${process.env.EC2_HOST}:8080/container/${action}/${projectId}`;
  const response = await fetch(url, { method: 'POST', timeout: 10000 });
  if (!response.ok) throw new Error(`Runtime manager error: ${response.status}`);
  return response.json();
}
