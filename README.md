# ☁️ CloudLaunch – Student App Deployment Platform

Full-stack AWS-powered platform for deploying student projects as Docker containers.

## Architecture
```
User → S3+CloudFront → AWS Cognito → API Gateway
     → Lambda/Node.js Backend → DynamoDB
     → CodePipeline → CodeBuild → ECR
     → EC2 (Docker containers) → Nginx → Live URL
```

## Project Structure
```
cloudlaunch/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express API
└── infra/             # AWS infrastructure configs
    ├── buildspec.yml      # CodeBuild build steps
    ├── nginx.conf         # Nginx reverse proxy
    ├── setup-dynamo.sh    # DynamoDB table setup
    └── runtime-manager/   # EC2 container manager
```

## Quick Start

### 1. AWS Setup
- Create a Cognito User Pool (email auth)
- Create an S3 bucket for ZIP uploads
- Create an ECR repository
- Create a CodeBuild project using `infra/buildspec.yml`
- Create DynamoDB tables: `bash infra/setup-dynamo.sh`
- Launch an EC2 instance (t2/t3.micro), install Docker
- Deploy `infra/runtime-manager/` on EC2

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Fill in Cognito User Pool ID and Client ID
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in all AWS credentials and config
npm install
npm run dev
```

### 4. Environment Variables

**Frontend (.env)**
```
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env)** — see `backend/.env.example`

## Features
- ✅ Register / Login / Verify Email (AWS Cognito)
- ✅ Forgot Password / Reset Password
- ✅ Change Password
- ✅ User Profile management
- ✅ Deploy via GitHub URL or ZIP upload
- ✅ Real-time deployment status
- ✅ Build logs + Runtime logs (CloudWatch)
- ✅ Stop / Restart / Delete projects
- ✅ Admin dashboard (user & project management)
- ✅ Audit trail for all user actions
- ✅ Role-based access control
- ✅ Container isolation per project
- ✅ Nginx reverse proxy routing

## Admin Setup
To make a user admin, add them to the `admin` Cognito group:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username user@email.com \
  --group-name admin
```
