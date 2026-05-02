# CloudLaunch Deployment Architecture

## 🚀 Current Architecture (SQS + EC2 Runtime Manager)

```
┌─────────────────────────────────────────────────────────────────┐
│  React Frontend (Deploy.jsx)                                    │
│  - User submits GitHub URL + runtime                            │
│  - Authenticates via Cognito JWT                                │
└────────────────┬────────────────────────────────────────────────┘
                 │ POST /api/deploy
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Express Backend (Node.js)                                      │
│  - Validates JWT token (middleware/auth.js)                     │
│  - Validates deployment request                                 │
│  - Generates projectId (UUID)                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐      ┌──────────┐
   │DynamoDB │      │SQS Queue │
   │(Project)│      │(Messages)│
   └─────────┘      └────┬─────┘
                         │ Message Body:
                         │ {
                         │   action: "deploy",
                         │   projectId: "uuid",
                         │   project: {...}
                         │ }
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  EC2 Instance (Runtime Manager - worker.js)                     │
│  - Polls SQS every 10 seconds                                   │
│  - Consumes deployment message                                  │
│  - Clones GitHub repository                                     │
│  - Builds Docker image                                          │
│  - Runs container                                               │
│  - Updates DynamoDB status to "running"                         │
│  - Deletes message from queue                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │ Updates status
                 ▼
        ┌────────────────┐
        │   DynamoDB     │
        │ (Status: running)
        └────────────────┘
                 ▲
                 │ GET /api/projects/:id
                 │ (frontend polls)
                 │
┌────────────────┴────────────────────────────────────────────────┐
│  React Frontend Dashboard                                       │
│  - Shows deployment status                                      │
│  - Displays live URL when ready                                 │
│  - http://{EC2_IP}:{port}                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Message Flow

### 1. Frontend → Backend
```bash
POST /api/deploy
Content-Type: application/json
Authorization: Bearer {cognito-id-token}

{
  "name": "my-app",
  "runtime": "Node.js",
  "githubUrl": "https://github.com/user/repo",
  "branch": "main",
  "port": 3000,
  "env": "API_KEY=xxx\nDATABASE_URL=yyy"
}
```

### 2. Backend Processes Request
- Validates JWT from Cognito
- Extracts userId from token claims
- Creates project metadata
- Saves to DynamoDB with status: "queued"
- Sends message to SQS

### 3. SQS Message Format
```json
{
  "action": "deploy",
  "projectId": "7fe7cd2b-5f5d-4053-badf-f85635853050",
  "project": {
    "id": "7fe7cd2b-5f5d-4053-badf-f85635853050",
    "userId": "cognito-sub-123",
    "name": "my-app",
    "runtime": "Node.js",
    "githubUrl": "https://github.com/user/repo",
    "branch": "main",
    "port": 3000,
    "env": "API_KEY=xxx\nDATABASE_URL=yyy",
    "status": "queued",
    "createdAt": "2024-04-16T10:30:00Z",
    ...
  }
}
```

### 4. EC2 Worker Processes Message
- Polls SQS queue every 10 seconds
- Parses message body
- Validates required fields
- Updates project status to "building"
- Clones GitHub repo: `git clone --branch main <github-url> /tmp/{projectId}`
- Generates Dockerfile (if not present)
- Builds Docker image: `docker build -t cloudlaunch-{projectId}:latest .`
- Runs container: `docker run -d -p 3000:3000 cloudlaunch-{projectId}:latest`
- Updates DynamoDB status to "running"
- Deletes message from SQS

### 5. Frontend Polls Status
```bash
GET /api/projects/{projectId}
Authorization: Bearer {cognito-id-token}
```

Response:
```json
{
  "id": "7fe7cd2b-5f5d-4053-badf-f85635853050",
  "name": "my-app",
  "status": "running",
  "runtime": "Node.js",
  "port": 3000,
  "liveUrl": "http://ec2-ip:3000"
}
```

## 🛠️ EC2 Setup

### Prerequisites
- AWS EC2 instance (t2.medium or larger recommended)
- Docker installed
- Node.js 18+
- Git
- AWS credentials (IAM instance profile preferred)

### Installation Steps

```bash
# 1. SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# 2. Clone repository
git clone https://github.com/your-repo/cloudlaunch.git
cd cloudlaunch

# 3. Run setup script
chmod +x infra/setup-ec2.sh
bash infra/setup-ec2.sh

# 4. Configure environment
cat > .env << EOF
AWS_REGION=ap-south-1
SQS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT/deployqueue
PROJECTS_TABLE=cloudlaunch-projects
LOGS_TABLE=cloudlaunch-logs
EOF

# 5. Start processes
pm2 start ecosystem.config.js
pm2 save

# 6. Verify
pm2 list
pm2 logs deploy-worker
```

### Required IAM Permissions

For the EC2 instance role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueUrl"
      ],
      "Resource": "arn:aws:sqs:ap-south-1:ACCOUNT:deployqueue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:ACCOUNT:table/cloudlaunch-*"
    }
  ]
}
```

## 📊 File Reference

```
infra/
├── runtime-manager/
│   ├── server.js           # REST API for container management
│   └── worker.js           # SQS consumer (MAIN WORKER)
├── setup-ec2.sh            # EC2 setup script
└── ecosystem.config.js     # PM2 process manager config (root)
```

## ✅ Key Features

- ✅ Scalable: Multiple EC2 workers can consume from same queue
- ✅ Durable: SQS ensures messages aren't lost
- ✅ Resilient: Failed deployments update status to "error"
- ✅ Logged: All events logged to DynamoDB and CloudWatch
- ✅ Secure: JWT authentication on all API calls
- ✅ Multi-Runtime: Supports Node.js, Python, Java with generated Dockerfiles

## 🐛 Troubleshooting

**Problem**: Worker logs show "Invalid message"
**Solution**: Check SQS message format in backend. Ensure `action`, `projectId`, `project` are present.

**Problem**: "No Authorization header" from frontend
**Solution**: Check Amplify config in `frontend/src/aws-config.js`. Ensure Cognito pool ID is correct.

**Problem**: Container fails to start
**Solution**: Check Docker permissions (`docker ps`), GitHub repo access, and runtime environment variables.
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
