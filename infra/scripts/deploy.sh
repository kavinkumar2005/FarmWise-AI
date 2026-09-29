#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " FarmwiseAI Phase 1 Deployment Automation (ap-south-1)    "
echo "=========================================================="

CONFIG_FILE="config/team.json"
if [ ! -f "" ]; then
  echo "Error:  not found!"
  exit 1
fi

TEAM_ID=01
REGION=ap-south-1
ROLE_ARN=arn:aws:iam::100247989552:role/FAI-TCE-LambdaExecutionRole
PREFIX=fai-tce-team01

echo "Deploying for Team: "
echo "Region:  (Strictly ap-south-1)"
echo "Resource Prefix: "
echo "Execution Role: "

if [ "" != "ap-south-1" ]; then
  echo "FATAL: Only ap-south-1 is permitted!"
  exit 1
fi

# 1. Create S3 Buckets
BUCKETS=("-uploads" "-geodata" "-advisory" "-reports")
for BUCKET in ""; do
  echo "Ensuring S3 bucket: "
  aws s3api create-bucket \
    --bucket "" \
    --region "" \
    --create-bucket-configuration LocationConstraint="" 2>/dev/null || true
  
  aws s3api put-bucket-encryption \
    --bucket "" \
    --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}' 2>/dev/null || true
  
  aws s3api put-public-access-block \
    --bucket "" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" 2>/dev/null || true
done

# 2. Create DynamoDB Tables
TABLES=("-runs" "-parcels" "-landrecords" "-refimages" "-advisory-chunks" "-chats" "-cache")
for TABLE in ""; do
  echo "Ensuring DynamoDB table: "
  aws dynamodb create-table \
    --table-name "" \
    --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
    --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "" 2>/dev/null || true
done

# 3. Build & Deploy API Gateway Handler Lambda
echo "Building api-gateway-handler with esbuild..."
npx esbuild services/api-gateway-handler/src/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --outfile=services/api-gateway-handler/dist/index.js \
  --external:@aws-sdk/*

cd services/api-gateway-handler/dist
zip -r handler.zip index.js
cd -

LAMBDA_NAME="-api-gateway-handler"
echo "Deploying Lambda function: "

aws lambda create-function \
  --function-name "" \
  --runtime nodejs20.x \
  --role "" \
  --handler index.handler \
  --zip-file fileb://services/api-gateway-handler/dist/handler.zip \
  --region "" \
  --environment "Variables={TEAM_ID=,NODE_ENV=production,AWS_REGION=}" 2>/dev/null || \
aws lambda update-function-code \
  --function-name "" \
  --zip-file fileb://services/api-gateway-handler/dist/handler.zip \
  --region ""

echo "Phase 1 deployment completed successfully!"
