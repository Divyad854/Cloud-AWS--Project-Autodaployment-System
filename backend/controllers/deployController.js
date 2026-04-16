const { v4: uuidv4 } = require('uuid');
const { dynamo, TABLES } = require('../config/dynamo');
const { sqs } = require('../config/aws');
const { auditLog } = require('../utils/audit');
const logger = require('../utils/logger');

const resolveRuntimeHost = (runtime) => {
  const normalized = String(runtime || '').trim().toLowerCase();
  if (normalized.includes('python')) return process.env.EC2_HOST_PYTHON || 'python-ec2';
  if (normalized.includes('java')) return process.env.EC2_HOST_JAVA || 'javadeploy';
  if (normalized.includes('node')) return process.env.EC2_HOST_NODE || 'deploy';
  return process.env.EC2_HOST || 'deploy';
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

    const { name, runtime, githubUrl, branch = 'main', port = 3000 } = req.body;

    if (!name || !runtime || !githubUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const projectId = uuidv4();
    const source = 'github';
    const sourceLocation = githubUrl;
    const runtimeHost = resolveRuntimeHost(runtime);

    const projectItem = {
      id: projectId,
      projectid: projectId,
      userId,
      name,
      runtime,
      runtimeHost,
      source,
      sourceLocation,
      githubUrl,
      branch,
      port: Number(port) || 3000,
      imageTag: projectId,
      status: 'queued',
      createdAt: new Date().toISOString(),
      userId,
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
        action: 'deploy',
        projectId,
        project: projectItem,
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
