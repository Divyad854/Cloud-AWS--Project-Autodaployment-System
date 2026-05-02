const { dynamo, TABLES } = require('../config/dynamo');
const { sqs } = require('../config/aws');
const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const getUserId = (req) => {
  const id = req.user?.sub;
  if (!id) throw new Error('Unauthorized');
  return String(id);
};

// ✅ LIST PROJECTS (FIXED)
exports.listProjects = async (req, res, next) => {
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

    res.json({ projects: result.Items || [] });

  } catch (err) {
    next(err);
  }
};

// ✅ GET SINGLE PROJECT
exports.getProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    const result = await dynamo.get({
      TableName: TABLES.PROJECTS,
      Key: {
        projectid: req.params.id,
        partitionid: userId,
      },
    }).promise();

    res.json({ project: result.Item });

  } catch (err) {
    next(err);
  }
};

// ✅ DELETE PROJECT
exports.deleteProject = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    await dynamo.delete({
      TableName: TABLES.PROJECTS,
      Key: {
        projectid: req.params.id,
        partitionid: userId,
      },
    }).promise();

    res.json({ message: 'Deleted' });

  } catch (err) {
    next(err);
  }
};

// ✅ STOP / RESTART (OPTIONAL SAME STYLE)
exports.stopProject = async (req, res) => {
  res.json({ message: 'Stopped' });
};
exports.restartProject = async (req, res, next) => {
  console.log("🔁 ===== RESTART API CALLED =====");

  try {
    const userId = getUserId(req);
    const projectId = req.params.id;

    console.log("👤 User ID:", userId);
    console.log("📦 Project ID:", projectId);

    // =========================
    // ✅ 1. GET PROJECT
    // =========================
    console.log("📡 Fetching project from DynamoDB...");

    const result = await dynamo.get({
      TableName: TABLES.PROJECTS,
      Key: {
        projectid: projectId,
        partitionid: userId,
      },
    }).promise();

    const project = result.Item;

    console.log("📄 DynamoDB Result:", JSON.stringify(project, null, 2));

    if (!project) {
      console.log("❌ Project not found");
      return res.status(404).json({ message: "Project not found" });
    }

    // =========================
    // ❗ PREVENT DOUBLE DEPLOY
    // =========================
    

    // =========================
    // ✅ 2. UPDATE STATUS
    // =========================
    console.log("📝 Updating project status → queued");

    await dynamo.update({
      TableName: TABLES.PROJECTS,
      Key: {
        projectid: projectId,
        partitionid: userId,
      },
      UpdateExpression: "SET #status = :s, deployUrl = :d",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":s": "queued",
        ":d": "",
      },
    }).promise();

    console.log("✅ DynamoDB update successful");

    // =========================
    // ✅ 3. PREPARE SQS MESSAGE
    // =========================
    const message = {
      projectId: project.projectid,
      userId,
      repoUrl: project.githubUrl,
      runtime: project.runtime,
      backendPort: project.port,
      env: project.env || "",
    };

    console.log("📤 SQS MESSAGE:");
    console.log(JSON.stringify(message, null, 2));

    if (!process.env.SQS_QUEUE_URL) {
      throw new Error("❌ SQS_QUEUE_URL missing in env");
    }

    // =========================
    // ✅ 4. SEND TO SQS
    // =========================
    console.log("🚀 Sending message to SQS...");

    const response = await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(message),
      })
    );

    console.log("✅ SQS SENT SUCCESS");
    console.log("🆔 Message ID:", response.MessageId);

    // =========================
    // ✅ RESPONSE
    // =========================
    res.json({
      message: "Project restart queued",
      messageId: response.MessageId,
    });

  } catch (err) {
    console.error("❌ RESTART ERROR:");
    console.error(err);

    next(err);
  }

  console.log("🔁 ===== RESTART API END =====");
};
// ✅ REDEPLOY
exports.redeployProject = async (req, res) => {
  res.json({ message: 'Redeploy triggered' });
};

// ✅ BUILD LOGS
exports.getBuildLogs = async (req, res) => {
  res.json({ logs: "No build logs yet" });
};

// ✅ RUNTIME LOGS
exports.getRuntimeLogs = async (req, res) => {
  res.json({ logs: "No runtime logs yet" });
};