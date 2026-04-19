const { dynamo, TABLES } = require('../config/dynamo');
const { sqs } = require('../config/aws');
const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const logger = require('../utils/logger');

// ✅ Normalize runtime
const normalizeRuntime = (runtime) => {
  if (!runtime) return null;

  const r = String(runtime).toLowerCase();

  if (r.includes('node')) return 'node';
  if (r.includes('python')) return 'python';
  if (r.includes('java')) return 'java';

  return null;
};

// ✅ Get user
const getUserId = (req) => {
  const userId = req.user?.sub;
  if (!userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return userId;
};

exports.deploy = async (req, res) => {
  try {
    console.log("🔥 DEPLOY API CALLED");

    const userId = getUserId(req);

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

    const portNumber = backendPort
      ? Number(backendPort)
      : port
      ? Number(port)
      : 5000;

    // ✅ Validation
    if (!name || !runtime || !sourceUrl) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    if (!Number.isInteger(portNumber) || portNumber <= 0) {
      return res.status(400).json({
        message: 'Invalid port number',
      });
    }

    // ✅ Normalize runtime
    const normalizedRuntime = normalizeRuntime(runtime);
    if (!normalizedRuntime) {
      return res.status(400).json({
        message: 'Unsupported runtime',
      });
    }

    // ✅ Generate projectId
    const projectId = name.toLowerCase().replace(/\s+/g, '');

    // =========================
    // 🔥 PREVENT DUPLICATE DEPLOY
    // =========================
  const userIdStr = String(userId);

const existing = await dynamo.get({
  TableName: TABLES.PROJECTS,
  Key: {
    projectid: projectId,
    partitionid: userIdStr,
  },
}).promise();

    if (existing.Item) {
      return res.status(400).json({
        message: "Deployment already triggered for this project",
      });
    }

    // =========================
    // ✅ SAVE TO DYNAMODB
    // =========================
    const projectItem = {
      projectid: projectId,
       partitionid: String(userId), 
      name,
      runtime: normalizedRuntime,
      source: 'github',
      githubUrl: sourceUrl,
      branch,
      port: portNumber,
      env,
      status: 'queued',
        // 🔥 ADD THIS
  deployUrl: "",
      createdAt: new Date().toISOString(),
    };

    console.log("========== DYNAMO ITEM ==========");
    console.log(JSON.stringify(projectItem, null, 2));

    await dynamo.put({
      TableName: TABLES.PROJECTS,
      Item: projectItem,
    }).promise();

    console.log("✅ DynamoDB SAVE SUCCESS");

    // =========================
    // ✅ SEND TO SQS (ONLY ONCE)
    // =========================
    const sqsMessage = {
      projectId,
      userId,
      repoUrl: sourceUrl,
      runtime: normalizedRuntime,
      backendPort: portNumber,
      env,
    };

    console.log("========== SQS MESSAGE ==========");
    console.log(JSON.stringify(sqsMessage, null, 2));

    if (!process.env.SQS_QUEUE_URL) {
      throw new Error('SQS_QUEUE_URL is not configured');
    }

    const response = await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(sqsMessage),

        // 🔥 OPTIONAL (FIFO ONLY)
        // MessageGroupId: userId,
        // MessageDeduplicationId: projectId,
      })
    );

    console.log("✅ SQS SUCCESS:", response.MessageId);

    res.json({
      message: "Deployment queued",
      projectId,
      messageId: response.MessageId,
    });

  } catch (error) {
    console.error("❌ DEPLOY ERROR:", error);
    logger.error("DEPLOY ERROR:", error);

    res.status(error.statusCode || 500).json({
      message: "Deployment failed",
      error: error.message,
    });
  }
};

// =========================
// ✅ GET USER PROJECTS
// =========================
exports.getUserProjects = async (req, res) => {
  try {
    const userId = req.user.sub;
     
    console.log("USER ID FROM TOKEN:", userId);
   const userIdStr = String(userId);

const result = await dynamo.scan({
  TableName: TABLES.PROJECTS,
  FilterExpression: "#pid = :uid",
  ExpressionAttributeNames: {
    "#pid": "partitionid", // 🔥 IMPORTANT FIX
  },
  ExpressionAttributeValues: {
    ":uid": userIdStr,
  },
}).promise();

    res.json({
      projects: result.Items || [],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};