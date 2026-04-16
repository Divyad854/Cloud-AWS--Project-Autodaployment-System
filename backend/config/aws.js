// config/aws.js
const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const ecr = new AWS.ECR();
const cloudwatch = new AWS.CloudWatchLogs();
const cognitoISP = new AWS.CognitoIdentityServiceProvider();

module.exports = { s3, sqs, ecr, cloudwatch, cognitoISP, AWS };