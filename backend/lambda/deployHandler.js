const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET_NAME = process.env.S3_BUCKET || 'cloudlaunch-uploads';
const QUEUE_URL = process.env.SQS_QUEUE_URL;
const TABLE_NAME = process.env.DYNAMO_TABLE || process.env.DYNAMO_PROJECTS_TABLE;

const isValidTableName = (name) => typeof name === 'string' && /^[a-zA-Z0-9_.-]+$/.test(name);

const s3 = new AWS.S3({ region: REGION });
const sqs = new AWS.SQS({ region: REGION });
const dynamo = new AWS.DynamoDB.DocumentClient({ region: REGION });

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  },
  body: JSON.stringify(body),
});

const parseBody = (event) => {
  if (!event.body) return {};
  if (event.isBase64Encoded) {
    return JSON.parse(Buffer.from(event.body, 'base64').toString('utf8'));
  }
  if (typeof event.body === 'string') {
    return JSON.parse(event.body);
  }
  return event.body;
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return createResponse(200, { message: 'OK' });
    }

    const payload = parseBody(event);
    const {
      name,
      runtime,
      source,
      githubUrl,
      branch = 'main',
      port = 3000,
      zipFileBase64,
      zipFileName,
      userId,
      userEmail,
    } = payload;

    if (!name || !runtime || !source) {
      return createResponse(400, { message: 'Missing required deployment fields' });
    }

    if (!TABLE_NAME) {
      return createResponse(500, {
        message: 'DYNAMO_PROJECTS_TABLE or DYNAMO_TABLE environment variable is required',
      });
    }

    if (!isValidTableName(TABLE_NAME)) {
      return createResponse(500, {
        message: `Invalid DynamoDB table name '${TABLE_NAME}'. Allowed characters are letters, numbers, underscore, period, and hyphen.`,
      });
    }

    if (!['github', 'zip'].includes(source)) {
      return createResponse(400, { message: 'Source must be github or zip' });
    }

    const projectId = uuidv4();
    const imageTag = projectId;
    let sourceLocation = null;

    if (source === 'zip') {
      if (!zipFileBase64) {
        return createResponse(400, { message: 'zipFileBase64 is required for ZIP deployments' });
      }
      const buffer = Buffer.from(zipFileBase64, 'base64');
      const key = `uploads/${projectId}/source.zip`;

      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'application/zip',
      }).promise();

      sourceLocation = `s3://${BUCKET_NAME}/${key}`;
    } else {
      if (!githubUrl) {
        return createResponse(400, { message: 'githubUrl is required for GitHub deployments' });
      }
      sourceLocation = githubUrl;
    }

    const projectItem = {
      partitionid: projectId,
      id: projectId,
      projectid: projectId,
      name,
      runtime,
      source,
      sourceLocation,
      githubUrl: githubUrl || null,
      branch,
      port: Number(port) || 3000,
      imageTag,
      status: 'queued',
      createdAt: new Date().toISOString(),
      userId: userId || 'anonymous',
      userEmail: userEmail || null,
    };

    if (TABLE_NAME) {
      await dynamo
        .put({
          TableName: TABLE_NAME,
          Item: projectItem,
        })
        .promise();
    }

    // TODO: Enable SQS queue after IAM permissions are configured
    if (QUEUE_URL) {
      try {
        await sqs
          .sendMessage({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
              action: 'deploy',
              projectId,
              project: projectItem,
            }),
          })
          .promise();
      } catch (sqsErr) {
        console.warn('SQS send failed (permissions issue), continuing without queue:', sqsErr.message);
      }
    }

    return createResponse(200, {
      projectId,
      message: 'Deployment queued ✅',
    });
  } catch (error) {
    console.error('Lambda deployHandler error:', error);
    return createResponse(500, {
      message: error.message || 'Internal server error',
      error: error.stack ? error.stack.split('\n')[0] : undefined,
    });
  }
};
