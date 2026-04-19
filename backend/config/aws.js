// config/aws.js
const { S3Client } = require('@aws-sdk/client-s3');
const { SQSClient } = require('@aws-sdk/client-sqs');
const { ECRClient } = require('@aws-sdk/client-ecr');
const { CloudWatchLogsClient } = require('@aws-sdk/client-cloudwatch-logs');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3 = new S3Client(awsConfig);
const sqs = new SQSClient(awsConfig);
const ecr = new ECRClient(awsConfig);
const cloudwatch = new CloudWatchLogsClient(awsConfig);
const cognitoISP = new CognitoIdentityProviderClient(awsConfig);

module.exports = { s3, sqs, ecr, cloudwatch, cognitoISP };