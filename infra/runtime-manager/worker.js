#!/usr/bin/env node

// SQS Queue Consumer for CloudLaunch
// Runs on EC2 instance to consume deployment messages from SQS

const AWS = require('aws-sdk');
const { execSync, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Configure AWS
const sqsRegion = process.env.AWS_REGION || 'ap-south-1';
const sqs = new AWS.SQS({ region: sqsRegion });
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: sqsRegion });

const QUEUE_URL = process.env.SQS_QUEUE_URL;
const PROJECTS_TABLE = process.env.PROJECTS_TABLE || 'cloudlaunch-projects';
const LOGS_TABLE = process.env.LOGS_TABLE || 'cloudlaunch-logs';
const POLL_INTERVAL = 10000; // 10 seconds between polls

if (!QUEUE_URL) {
  console.error('❌ SQS_QUEUE_URL not configured');
  process.exit(1);
}

console.log(`✅ SQS Worker Started`);
console.log(`📋 Queue URL: ${QUEUE_URL}`);
console.log(`📊 Region: ${sqsRegion}`);
console.log(`📁 Work Directory: /tmp`);
console.log('---');

/**
 * Update project status in DynamoDB
 */
async function updateProjectStatus(projectId, status, details = {}) {
  try {
    await dynamodb.update({
      TableName: PROJECTS_TABLE,
      Key: { projectid: projectId },
      UpdateExpression: 'SET #status = :status, updatedAt = :ts',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':ts': new Date().toISOString(),
      },
    }).promise();

    console.log(`✅ [${projectId}] Status updated to: ${status}`);
  } catch (err) {
    console.error(`❌ [${projectId}] Failed to update status:`, err.message);
  }
}

/**
 * Write logs to DynamoDB
 */
async function writeLogs(projectId, logLine, type = 'build') {
  try {
    const timestamp = new Date().toISOString();
    await dynamodb.put({
      TableName: LOGS_TABLE,
      Item: {
        projectid: projectId,
        timestamp,
        message: logLine,
        type,
      },
    }).promise();
  } catch (err) {
    console.error(`⚠️  Failed to write log:`, err.message);
  }
}

/**
 * Parse and validate SQS message
 */
function parseMessage(messageBody) {
  try {
    console.log("📩 RAW MESSAGE:", messageBody);

    if (!messageBody) {
      console.error('❌ Invalid message: empty body');
      return null;
    }

    let msg = JSON.parse(messageBody);

    const parseNested = (value) => {
      if (!value || typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };

    // Handle SNS-wrapped payloads or nested message strings
    if (msg.Message && typeof msg.Message === 'string') {
      msg = parseNested(msg.Message);
    }

    if (msg.body && typeof msg.body === 'string') {
      msg = parseNested(msg.body);
    }

    if (msg.payload && typeof msg.payload === 'string') {
      msg = parseNested(msg.payload);
    }

    if (msg.Records && Array.isArray(msg.Records) && msg.Records.length > 0) {
      const record = msg.Records[0];
      if (record.Sns && record.Sns.Message) {
        msg = parseNested(record.Sns.Message);
      }
      if (record.body && typeof record.body === 'string') {
        msg = parseNested(record.body);
      }
    }

    if (msg.project && typeof msg.project === 'string') {
      msg.project = parseNested(msg.project);
    }

    console.log("📦 PARSED MSG:", JSON.stringify(msg, null, 2));

    // Accept direct deploy payload format
    if (!msg.action && msg.projectId && (msg.repoUrl || msg.githubUrl) && msg.runtime) {
      msg = {
        action: 'deploy',
        projectId: msg.projectId,
        project: {
          partitionid: msg.projectId,
          id: msg.projectId,
          projectid: msg.projectId,
          name: msg.name || msg.projectId,
          runtime: msg.runtime,
          githubUrl: msg.repoUrl || msg.githubUrl,
          branch: msg.branch || 'main',
          port: msg.backendPort ? Number(msg.backendPort) : msg.port ? Number(msg.port) : 5000,
          env: msg.env || '',
        },
      };
    }

    // Normalize partial project payload with action deploy
    if (msg.action === 'deploy' && !msg.project && msg.projectId && (msg.repoUrl || msg.githubUrl) && msg.runtime) {
      msg.project = {
        partitionid: msg.projectId,
        id: msg.projectId,
        projectid: msg.projectId,
        name: msg.name || msg.projectId,
        runtime: msg.runtime,
        githubUrl: msg.repoUrl || msg.githubUrl,
        branch: msg.branch || 'main',
        port: msg.backendPort ? Number(msg.backendPort) : msg.port ? Number(msg.port) : 5000,
        env: msg.env || '',
      };
    }

    if (msg.action === 'deploy' && msg.project && !msg.project.githubUrl && (msg.repoUrl || msg.githubUrl)) {
      msg.project.githubUrl = msg.project.githubUrl || msg.repoUrl || msg.githubUrl;
    }

    if (msg.project && !msg.project.branch) {
      msg.project.branch = 'main';
    }

    // Validate required fields
    if (!msg.action) {
      console.error('❌ Invalid message: missing action field', messageBody, msg);
      return null;
    }

    if (!msg.projectId) {
      console.error('❌ Invalid message: missing projectId field', messageBody);
      return null;
    }

    if (!msg.project) {
      console.error('❌ Invalid message: missing project field', messageBody);
      return null;
    }

    // Validate project has required fields
    if (!msg.project.githubUrl) {
      console.error('❌ Invalid message: project missing githubUrl', messageBody);
      return null;
    }

    return msg;
  } catch (err) {
    console.error('❌ Invalid message: JSON parse error -', err.message, messageBody);
    return null;
  }
}

/**
 * Clone GitHub repository
 */
async function cloneRepository(projectId, githubUrl, branch) {
  try {
    const repoDir = `/tmp/${projectId}`;
    
    // Clean up if exists
    if (fs.existsSync(repoDir)) {
      console.log(`🧹 Cleaning up existing directory...`);
      execSync(`rm -rf ${repoDir}`);
    }

    console.log(`📥 Cloning repository...`);
    console.log(`   URL: ${githubUrl}`);
    console.log(`   Branch: ${branch}`);
    
    execSync(`git clone --branch ${branch} --depth 1 ${githubUrl} ${repoDir}`, {
      stdio: 'pipe',
      timeout: 300000, // 5 minutes timeout
    });

    console.log(`✅ Repository cloned to ${repoDir}`);
    return repoDir;
  } catch (err) {
    console.error(`❌ Clone failed:`, err.message);
    throw new Error(`Failed to clone repository: ${err.message}`);
  }
}

/**
 * Build and push Docker image
 */
async function buildDockerImage(projectId, repoDir, runtime) {
  try {
    const imageTag = `cloudlaunch-${projectId}:latest`;
    console.log(`🐳 Building Docker image...`);
    console.log(`   Tag: ${imageTag}`);
    console.log(`   Runtime: ${runtime}`);

    // Create Dockerfile if not present
    const dockerfilePath = path.join(repoDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      console.log(`📝 No Dockerfile found, generating one...`);
      const dockerfile = generateDockerfile(runtime);
      fs.writeFileSync(dockerfilePath, dockerfile);
      console.log(`✅ Dockerfile generated`);
    } else {
      console.log(`✅ Using existing Dockerfile`);
    }

    // Build image
    execSync(`docker build -t ${imageTag} ${repoDir}`, {
      stdio: 'pipe',
      timeout: 600000, // 10 minutes timeout
    });

    console.log(`✅ Docker image built: ${imageTag}`);
    return imageTag;
  } catch (err) {
    console.error(`❌ Build failed:`, err.message);
    throw new Error(`Failed to build Docker image: ${err.message}`);
  }
}

/**
 * Generate Dockerfile based on runtime
 */
function generateDockerfile(runtime) {
  const normalized = String(runtime || '').toLowerCase().trim();

  if (normalized.includes('python')) {
    return `FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt 2>/dev/null || echo "No requirements.txt"
EXPOSE 5000
CMD ["python", "app.py"]
`;
  } else if (normalized.includes('java')) {
    return `FROM openjdk:17-slim
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*
RUN mvn clean package -DskipTests 2>/dev/null || echo "Maven build skipped"
EXPOSE 8080
ENV PORT=8080
CMD ["sh", "-c", "java -Dserver.port=$PORT -jar target/app.jar"]
`;
  } else {
    // Default to Node.js
    return `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production 2>/dev/null || npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`;
  }
}

/**
 * Run Docker container
 */
async function runContainer(projectId, imageTag, port, env) {
  try {
    const containerName = `app_${projectId}`;
    console.log(`🚀 Starting container...`);
    console.log(`   Name: ${containerName}`);
    console.log(`   Port: ${port}`);

    // Stop and remove existing container
    try {
      execSync(`docker stop ${containerName}`, { stdio: 'pipe' });
      execSync(`docker rm ${containerName}`, { stdio: 'pipe' });
      console.log(`🧹 Removed old container`);
    } catch {
      // Container doesn't exist, that's fine
    }

    // Build environment variables
    let envArgs = '';
    const envVars = String(env || '')
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);

    const portVarIndex = envVars.findIndex(
      (v) => v.split('=')[0].trim().toUpperCase() === 'PORT'
    );

    if (portVarIndex >= 0) {
      envVars[portVarIndex] = `PORT=${port}`;
    } else {
      envVars.unshift(`PORT=${port}`);
    }

    envArgs = envVars.map((v) => `-e "${v}"`).join(' ');

    // Run container
    const dockerCmd = [
      'docker run -d',
      `--name ${containerName}`,
      `-p ${port}:${port}`,
      '--restart unless-stopped',
      envArgs,
      imageTag,
    ].filter(Boolean).join(' ');

    execSync(dockerCmd, {
      stdio: 'pipe',
      timeout: 60000, // 1 minute timeout
    });

    console.log(`✅ Container started: ${containerName}`);
    return containerName;
  } catch (err) {
    console.error(`❌ Container start failed:`, err.message);
    throw new Error(`Failed to start container: ${err.message}`);
  }
}

/**
 * Process deployment message
 */
async function processDeployment(message) {
  const { projectId, project } = message;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 DEPLOYMENT STARTED: ${projectId}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📋 Project: ${project.name}`);
  console.log(`🔧 Runtime: ${project.runtime}`);
  console.log(`📍 GitHub: ${project.githubUrl}`);
  console.log(`🌿 Branch: ${project.branch || 'main'}`);
  console.log(`🔌 Port: ${project.port || 5000}`);

  try {
    // Step 1: Update status to building
    await updateProjectStatus(projectId, 'building');
    await writeLogs(projectId, `Deployment started`);

    // Step 2: Clone repository
    const repoDir = await cloneRepository(
      projectId,
      project.githubUrl,
      project.branch || 'main'
    );
    await writeLogs(projectId, `Repository cloned from ${project.githubUrl}`);

    // Step 3: Build Docker image
    const imageTag = await buildDockerImage(projectId, repoDir, project.runtime);
    await writeLogs(projectId, `Docker image built: ${imageTag}`);

    // Step 4: Run container
    const containerName = await runContainer(
      projectId,
      imageTag,
      project.port || 5000,
      project.env
    );
    await writeLogs(projectId, `Container running: ${containerName}`);

    // Step 5: Update status to running
    await updateProjectStatus(projectId, 'running');

    console.log(`\n✅ DEPLOYMENT COMPLETE: ${projectId}`);
    console.log(`${'='.repeat(60)}\n`);
    await writeLogs(projectId, `Deployment completed successfully`);

  } catch (err) {
    console.error(`\n❌ DEPLOYMENT FAILED: ${projectId}`);
    console.error(`Error: ${err.message}`);
    console.error(`${'='.repeat(60)}\n`);
    
    await updateProjectStatus(projectId, 'error');
    await writeLogs(projectId, `Deployment failed: ${err.message}`, 'error');
  }
}

/**
 * Poll SQS queue
 */
async function pollQueue() {
  try {
    const params = {
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
      VisibilityTimeout: 600, // 10 minutes for deployment
    };

    const data = await sqs.receiveMessage(params).promise();

    if (!data.Messages || data.Messages.length === 0) {
      console.log(`⏳ ${new Date().toISOString()} No messages...`);
      setTimeout(pollQueue, POLL_INTERVAL);
      return;
    }

    console.log(`\n📩 Received ${data.Messages.length} message(s) at ${new Date().toISOString()}`);

    for (const msg of data.Messages) {
      const parsed = parseMessage(msg.Body);

      if (!parsed) {
        console.error('❌ Invalid message - deleting from queue');
        // Delete invalid message to prevent infinite retry
        try {
          await sqs.deleteMessage({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: msg.ReceiptHandle,
          }).promise();
        } catch (err) {
          console.error('❌ Failed to delete invalid message:', err.message);
        }
        continue;
      }

      try {
        await processDeployment(parsed);

        // Delete message from queue on success
        await sqs.deleteMessage({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle,
        }).promise();

        console.log(`✅ Message deleted from queue\n`);
      } catch (err) {
        console.error(`❌ Processing error:`, err.message);
        // Let message visibility timeout and retry
      }
    }

    // Schedule next poll
    setTimeout(pollQueue, POLL_INTERVAL);
  } catch (err) {
    console.error(`❌ Poll error:`, err.message);
    // Retry after longer interval on error
    setTimeout(pollQueue, POLL_INTERVAL * 2);
  }
}

// Start polling
console.log(`🚀 Starting message polling...\n`);
pollQueue().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

