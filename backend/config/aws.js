// config/aws.js
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const s3 = new AWS.S3();
const codebuild = new AWS.CodeBuild();
const ecr = new AWS.ECR();
const cloudwatch = new AWS.CloudWatchLogs();
const cognitoISP = new AWS.CognitoIdentityServiceProvider();

module.exports = { s3, codebuild, ecr, cloudwatch, cognitoISP, AWS };
