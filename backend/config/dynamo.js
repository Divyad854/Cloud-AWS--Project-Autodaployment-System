// config/dynamo.js

require('dotenv').config();
const AWS = require('aws-sdk');

// 🔥 AWS CONFIG
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',

  // ✅ use env OR fallback (for testing)
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_KEY',
});

// ✅ DynamoDB client
const dynamo = new AWS.DynamoDB.DocumentClient();

// ✅ TABLE NAMES (ONLY ONE OBJECT ✅)
const TABLES = {
  PROJECTS: process.env.DYNAMO_PROJECTS_TABLE || 'deploy-projects',
  USERS: process.env.DYNAMO_USERS_TABLE || 'cloudlaunch-users',
  AUDIT: process.env.DYNAMO_AUDIT_TABLE || 'cloudlaunch-audit',
NOTIFICATIONS: process.env.DYNAMO_NOTIFICATIONS_TABLE || 'Notifications'
};

// ✅ EXPORT
module.exports = {
  dynamo,
  TABLES,
};