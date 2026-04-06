# CloudLaunch Deployment Architecture

## 🚀 Current Architecture (CodeBuild-based)

```
┌─────────────────────────────────────────────────────────────────┐
│  React Frontend (Deploy.jsx)                                    │
│  - User selects ZIP file or GitHub URL                         │
│  - Submits deployment request                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Gateway / Express Backend (Node.js)                        │
│  - Authenticates user (JWT from Cognito)                        │
│  - Validates request (name, runtime, source)                    │
│  - Generates projectId (UUID)                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  AWS S3 (cloudlaunch-uploads bucket)                            │
│  - ZIP uploaded to: s3://bucket/uploads/{projectId}/source.zip  │
│  - Returns S3 key for reference                                 │
│  Location: backend/aws/s3.js uploadZipToS3()                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  DynamoDB (Projects table)                                      │
│  - Stores project metadata                                      │
│  - Status: "building" → "running" → "active"                    │
│  - Tracks: projectId, userId, runtime, sourceLocation, port     │
│  Location: backend/controllers/projectController.js             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  AWS CodeBuild (Managed Build Service)                          │
│  - Starts build with project config                             │
│  - Pulls source from S3                                         │
│  - Runs buildspec.yml                                           │
│  - Builds Docker image                                          │
│  - Pushes to AWS ECR (Elastic Container Registry)               │
│  Location: infra/buildspec.yml                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  AWS ECR (Container Registry)                                   │
│  - Stores Docker images                                         │
│  - Image tagged: {ECR_REGISTRY}/{projectId}:latest              │
│  - Available for EC2 to pull                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  AWS CloudWatch Logs                                            │
│  - Build logs: /aws/codebuild/{CODEBUILD_PROJECT}               │
│  - Runtime logs: /cloudlaunch/containers                        │
│  - Tracked per projectId                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  EC2 Instance (Runtime Manager)                                 │
│  - Pulls image from ECR                                         │
│  - Runs: docker run -p {PORT}:{PORT} {IMAGE}                    │
│  - Serves app on: http://{EC2_IP}:{PORT}                        │
│  - Manages lifecycle (start, stop, restart, delete)             │
│  Location: infra/runtime-manager/server.js                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Public URL Delivered                                           │
│  - Dashboard shows: http://{EC2_IP}:{allocated_port}            │
│  - User can access deployed app                                 │
│  - Status updates via polling or WebSocket                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Alternative Architecture (Lambda + SQS)

If you want to migrate to a serverless approach:

```
React → API Gateway `/deploy` → Lambda (upload to S3) →
SQS Message Queue → EC2 Worker (consumes queue) →
Pull Container → Run Docker → Update DB → Return URL
```

### Lambda Function Example:
```javascript
// Replaces CodeBuild step
const handler = async (event) => {
  const projectId = "proj-" + Date.now();
  const buffer = Buffer.from(event.body, "base64");
  
  // Upload to S3
  await s3.putObject({
    Bucket: "cloudlaunch-uploads",
    Key: `uploads/${projectId}/source.zip`,
    Body: buffer
  }).promise();
  
  // Send SQS message to EC2 worker
  await sqs.sendMessage({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ projectId, s3Key })
  }).promise();
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      projectId,
      message: "Deployment queued ✅"
    })
  };
};
```

---

## 📋 File Structure Reference

```
backend/
├── aws/
│   └── s3.js                    ✅ Handles S3 uploads
├── config/
│   └── aws.js                   ✅ AWS SDK initialization
├── controllers/
│   └── projectController.js     ✅ Orchestrates deployment flow
├── middleware/
│   └── auth.js                  ✅ JWT validation
└── routes/
    └── projects.js              ✅ POST /api/projects

frontend/
└── pages/
    └── Deploy.jsx               ✅ ZIP upload UI

infra/
├── buildspec.yml                ✅ CodeBuild configuration
├── runtime-manager/
│   └── server.js                ✅ EC2 Docker container manager
└── nginx.conf                   ✅ (Optional) Reverse proxy
```

---

## 🔧 Required Environment Variables

```bash
# AWS Credentials
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx

# AWS Services
COGNITO_USER_POOL_ID=xxxxx
CODEBUILD_PROJECT=xxxxx
ECR_REGISTRY=xxxxx.dkr.ecr.ap-south-1.amazonaws.com
ECR_REPOSITORY=cloudlaunch-apps

# Optional (for Lambda+SQS)
SQS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/.../queue

# EC2
EC2_HOST=your-ec2-ip
EC2_PORT=8080
```

---

## ✅ Deployment Checklist

When user uploads ZIP:
- [ ] ZIP file size < 100MB
- [ ] Contains Dockerfile at root
- [ ] Contains package.json or equivalent
- [ ] App listens on PORT 3000 by default
- [ ] No node_modules/ in ZIP (use .dockerignore)

Expected flow:
- [ ] Upload → S3 ✅
- [ ] DynamoDB record created ✅
- [ ] CodeBuild triggered ✅
- [ ] Docker image built & pushed to ECR ✅
- [ ] EC2 pulls image & runs container ✅
- [ ] URL returned to frontend ✅

---

## 🐛 Troubleshooting

**Problem**: "Cannot read properties of undefined (reading 'sub')"
**Solution**: Ensure auth middleware sets `req.user = payload` ✅

**Problem**: "Query condition missed key schema element: userId"
**Solution**: Ensure `getUserId()` function returns valid userId from JWT ✅

**Problem**: ZIP upload fails
**Solution**: Check S3 bucket permissions, ensure bucket exists ✅

**Problem**: CodeBuild fails
**Solution**: Check CloudWatch logs, verify buildspec.yml, ensure Dockerfile is valid

**Problem**: Container won't start
**Solution**: Verify EC2 has Docker installed, check runtime-manager logs

---

## 📞 Support

- Frontend Deploy: [Deploy.jsx](../frontend/src/pages/Deploy.jsx)
- Backend API: [projectController.js](./controllers/projectController.js)
- AWS S3: [s3.js](./aws/s3.js)
- Runtime Manager: [runtime-manager/server.js](../infra/runtime-manager/server.js)
