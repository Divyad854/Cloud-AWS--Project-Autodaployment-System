// config/dynamo.js
const AWS = require('aws-sdk');

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const dynamo = new AWS.DynamoDB.DocumentClient();

const TABLES = {
  PROJECTS: process.env.DYNAMO_PROJECTS_TABLE || 'cloudlaunch-projects',
  USERS: process.env.DYNAMO_USERS_TABLE || 'cloudlaunch-users',
  AUDIT: process.env.DYNAMO_AUDIT_TABLE || 'cloudlaunch-audit',
};

module.exports = { dynamo, TABLES };
