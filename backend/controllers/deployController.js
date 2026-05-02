// const { dynamo, TABLES } = require('../config/dynamo');
// const { sqs } = require('../config/aws');
// const { SendMessageCommand } = require('@aws-sdk/client-sqs');
// const logger = require('../utils/logger');

// // =========================
// // ✅ Normalize runtime
// // =========================
// const normalizeRuntime = (runtime) => {
//   if (!runtime) return null;

//   const r = String(runtime).toLowerCase();

//   if (r.includes('node')) return 'node';
//   if (r.includes('python')) return 'python';
//   if (r.includes('java')) return 'java';

//   return null;
// };

// // =========================
// // ✅ Get user
// // =========================
// const getUserId = (req) => {
//   const userId = req.user?.sub;
//   if (!userId) {
//     const err = new Error('Unauthorized');
//     err.statusCode = 401;
//     throw err;
//   }
//   return String(userId);
// };

// // =========================
// // 🚀 DEPLOY PROJECT
// // =========================
// exports.deploy = async (req, res) => {
//   try {
//     console.log("🔥 DEPLOY API CALLED");

//     const userId = getUserId(req);

//     const {
//       name,
//       runtime,
//       githubUrl,
//       repoUrl,
//       branch = 'main',
//       port,
//       backendPort,
//       env = '',
//     } = req.body;

//     const sourceUrl = githubUrl || repoUrl;

//     const portNumber = backendPort
//       ? Number(backendPort)
//       : port
//       ? Number(port)
//       : 5000;

//     // =========================
//     // ✅ Validation
//     // =========================
//     if (!name || !runtime || !sourceUrl) {
//       return res.status(400).json({
//         message: 'Missing required fields',
//       });
//     }

//     if (!Number.isInteger(portNumber) || portNumber <= 0) {
//       return res.status(400).json({
//         message: 'Invalid port number',
//       });
//     }

//     const normalizedRuntime = normalizeRuntime(runtime);
//     if (!normalizedRuntime) {
//       return res.status(400).json({
//         message: 'Unsupported runtime',
//       });
//     }

//     // =========================
//     // ✅ Generate projectId
//     // =========================
//     const projectId = name.toLowerCase().replace(/\s+/g, '');

//     // =========================
//     // 🔥 Prevent duplicate
//     // =========================
//     const existing = await dynamo.get({
//       TableName: TABLES.PROJECTS,
//       Key: {
//         projectid: projectId,
//         partitionid: userId,
//       },
//     }).promise();

//     if (existing.Item) {
//       return res.status(400).json({
//         message: "Deployment already triggered for this project",
//       });
//     }

//     // =========================
//     // ✅ Save to DynamoDB
//     // =========================
//     const projectItem = {
//       projectid: projectId,
//       partitionid: userId,
//       name,
//       runtime: normalizedRuntime,
//       source: 'github',
//       githubUrl: sourceUrl,
//       branch,
//       port: portNumber,
//       env,
//       status: 'queued',
//       deployUrl: "",
//       createdAt: new Date().toISOString(),
//     };

//     console.log("========== DYNAMO ITEM ==========");
//     console.log(JSON.stringify(projectItem, null, 2));

//     await dynamo.put({
//       TableName: TABLES.PROJECTS,
//       Item: projectItem,
//     }).promise();

//     console.log("✅ DynamoDB SAVE SUCCESS");

//     // =========================
//     // ✅ Send to SQS
//     // =========================
//     const sqsMessage = {
//       projectId,
//       userId,
//       repoUrl: sourceUrl,
//       runtime: normalizedRuntime,
//       backendPort: portNumber,
//       env,
//     };

//     console.log("========== SQS MESSAGE ==========");
//     console.log(JSON.stringify(sqsMessage, null, 2));

//     if (!process.env.SQS_QUEUE_URL) {
//       throw new Error('SQS_QUEUE_URL is not configured');
//     }

//     const response = await sqs.send(
//       new SendMessageCommand({
//         QueueUrl: process.env.SQS_QUEUE_URL,
//         MessageBody: JSON.stringify(sqsMessage),
//       })
//     );

//     console.log("✅ SQS SUCCESS:", response.MessageId);

//     return res.json({
//       message: "Deployment queued",
//       projectId,
//       messageId: response.MessageId,
//     });

//   } catch (error) {
//     console.error("❌ DEPLOY ERROR:", error);
//     logger.error("DEPLOY ERROR:", error);

//     return res.status(error.statusCode || 500).json({
//       message: "Deployment failed",
//       error: error.message,
//     });
//   }
// };

// // =========================
// // 📊 GET USER PROJECTS
// // =========================
// exports.getUserProjects = async (req, res) => {
//   try {
//     const userId = getUserId(req);

//     console.log("USER ID:", userId);

//     const result = await dynamo.scan({
//       TableName: TABLES.PROJECTS,
//       FilterExpression: "#pid = :uid",
//       ExpressionAttributeNames: {
//         "#pid": "partitionid",
//       },
//       ExpressionAttributeValues: {
//         ":uid": userId,
//       },
//     }).promise();

//     return res.json({
//       projects: result.Items || [],
//     });

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       message: "Failed to fetch projects",
//     });
//   }
// };

const { dynamo, TABLES } = require('../config/dynamo');
const { sqs } = require('../config/aws');
const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const logger = require('../utils/logger');

// =========================
// 🔔 CREATE NOTIFICATION
// =========================
const createNotification = async (data) => {
  try {
    await dynamo.put({
      TableName: TABLES.NOTIFICATIONS,
      Item: {
        notificationId: Date.now().toString(),
        userId: data.userId,
        userName: data.userName,
        email: data.email,
        projectName: data.projectName,
        status: data.status,
        message: data.message,
        createdAt: new Date().toISOString(),
        deletedByUser: false,
        deletedByAdmin: false,
        read: false
      }
    }).promise();
  } catch (err) {
    console.error("Notification error:", err);
  }
};

// =========================
// ✅ Normalize runtime
// =========================
const normalizeRuntime = (runtime) => {
  if (!runtime) return null;

  const r = String(runtime).toLowerCase();

  if (r.includes('node')) return 'node';
  if (r.includes('python')) return 'python';
  if (r.includes('java')) return 'java';

  return null;
};

// =========================
// ✅ Get user
// =========================
const getUserId = (req) => {
  const userId = req.user?.sub;
  if (!userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
  return String(userId);
};

// =========================
// 🚀 DEPLOY PROJECT
// =========================
exports.deploy = async (req, res) => {
  try {
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

    if (!name || !runtime || !sourceUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!Number.isInteger(portNumber) || portNumber <= 0) {
      return res.status(400).json({ message: 'Invalid port number' });
    }

    const normalizedRuntime = normalizeRuntime(runtime);
    if (!normalizedRuntime) {
      return res.status(400).json({ message: 'Unsupported runtime' });
    }

    const projectId = name.toLowerCase().replace(/\s+/g, '');

    const existing = await dynamo.get({
      TableName: TABLES.PROJECTS,
      Key: {
        projectid: projectId,
        partitionid: userId,
      },
    }).promise();

    if (existing.Item) {
      return res.status(400).json({
        message: "Deployment already triggered for this project",
      });
    }

    const projectItem = {
      projectid: projectId,
      partitionid: userId,
      name,
      runtime: normalizedRuntime,
      source: 'github',
      githubUrl: sourceUrl,
      branch,
      port: portNumber,
      env,
      status: 'queued',
      notifiedStatus: 'queued',
      deployUrl: "",
      createdAt: new Date().toISOString(),
    };

    await dynamo.put({
      TableName: TABLES.PROJECTS,
      Item: projectItem,
    }).promise();

    // 🔔 queued notification
    await createNotification({
      userId,
      userName: req.user?.name || "User",
      email: req.user?.email || "N/A",
      projectName: name,
      status: "queued",
      message: `⏳ ${name} project queued`
    });

    const sqsMessage = {
      projectId,
      userId,
      repoUrl: sourceUrl,
      runtime: normalizedRuntime,
      backendPort: portNumber,
      env,
    };

    const response = await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(sqsMessage),
      })
    );

    return res.json({
      message: "Deployment queued",
      projectId,
      messageId: response.MessageId,
    });

  } catch (error) {
    console.error("❌ DEPLOY ERROR:", error);
    logger.error("DEPLOY ERROR:", error);

    return res.status(error.statusCode || 500).json({
      message: "Deployment failed",
      error: error.message,
    });
  }
};

// =========================
// 📊 GET USER PROJECTS + AUTO NOTIFY (FIXED)
// =========================
exports.getUserProjects = async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await dynamo.scan({
      TableName: TABLES.PROJECTS,
      FilterExpression: "#pid = :uid",
      ExpressionAttributeNames: {
        "#pid": "partitionid",
      },
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    }).promise();

    const projects = result.Items || [];

    for (const project of projects) {

      let message = "";

      if (project.status === "queued") {
        message = `⏳ ${project.name} queued`;
      } else if (project.status === "building") {
        message = `🔨 ${project.name} is building`;
      } else if (project.status === "running") {
        message = `🚀 ${project.name} is live`;
      } else if (project.status === "failed") {
        message = `❌ ${project.name} failed`;
      }

      // ✅ FIXED CONDITION
      if (message && project.notifiedStatus !== project.status) {

        await createNotification({
          userId,
          userName: req.user?.name || "User",
          email: req.user?.email || "N/A",
          projectName: project.name,
          status: project.status,
          message
        });

        // ✅ update notifiedStatus
        await dynamo.update({
          TableName: TABLES.PROJECTS,
          Key: {
            projectid: project.projectid,
            partitionid: userId
          },
          UpdateExpression: "SET notifiedStatus = :ns",
          ExpressionAttributeValues: {
            ":ns": project.status
          }
        }).promise();
      }
    }

    return res.json({ projects });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};