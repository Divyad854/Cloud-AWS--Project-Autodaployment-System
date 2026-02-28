#!/bin/bash
# infra/setup-dynamo.sh
# Run this to create required DynamoDB tables

REGION=${AWS_REGION:-us-east-1}

echo "Creating DynamoDB tables in $REGION..."

# Projects table
aws dynamodb create-table \
  --region $REGION \
  --table-name cloudlaunch-projects \
  --attribute-definitions AttributeName=id,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes '[{"IndexName":"userId-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"},"BillingMode":"PAY_PER_REQUEST"}]' \
  --billing-mode PAY_PER_REQUEST 2>/dev/null && echo "✓ projects table created" || echo "~ projects table may already exist"

# Audit table
aws dynamodb create-table \
  --region $REGION \
  --table-name cloudlaunch-audit \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST 2>/dev/null && echo "✓ audit table created" || echo "~ audit table may already exist"

echo "Done!"
