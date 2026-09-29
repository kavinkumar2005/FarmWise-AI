#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " FarmwiseAI Phase 1 Deployment Automation (ap-south-1)    "
echo "=========================================================="

CONFIG_FILE="config/team.json"
ENV_FILE=".env.deploy"

# Load .env.deploy if present
if [ -f "$ENV_FILE" ]; then
  echo "Loading environment variables from $ENV_FILE..."
  set -a
  source "$ENV_FILE"
  set +a
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: $CONFIG_FILE not found!"
  exit 1
fi

TEAM_ID="${TEAM_ID:-06}"
REGION="${AWS_REGION:-ap-south-1}"
ROLE_ARN="${ROLE_ARN:-arn:aws:iam::100247989552:role/FAI-TCE-LambdaExecutionRole}"
PREFIX="${RESOURCE_PREFIX:-fai-tce-team06}"

echo "Deploying for Team: $TEAM_ID"
echo "Region: $REGION (Strictly ap-south-1)"
echo "Resource Prefix: $PREFIX"
echo "Execution Role: $ROLE_ARN"

if [ "$REGION" != "ap-south-1" ]; then
  echo "FATAL: Only ap-south-1 is permitted!"
  exit 1
fi

# 1. Create S3 Buckets
BUCKETS=("$PREFIX-uploads" "$PREFIX-geodata" "$PREFIX-advisory" "$PREFIX-reports")
for BUCKET in "${BUCKETS[@]}"; do
  echo "Ensuring S3 bucket: $BUCKET"
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || true
  
  aws s3api put-bucket-encryption \
    --bucket "$BUCKET" \
    --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}' 2>/dev/null || true
  
  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" 2>/dev/null || true
done

# 2. Create DynamoDB Tables
TABLES=("$PREFIX-runs" "$PREFIX-parcels" "$PREFIX-landrecords" "$PREFIX-refimages" "$PREFIX-advisory-chunks" "$PREFIX-chats" "$PREFIX-cache")
for TABLE in "${TABLES[@]}"; do
  echo "Ensuring DynamoDB table: $TABLE"
  aws dynamodb create-table \
    --table-name "$TABLE" \
    --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
    --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region "$REGION" 2>/dev/null || true
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

LAMBDA_NAME="$PREFIX-api-gateway-handler"
echo "Deploying Lambda function: $LAMBDA_NAME"

aws lambda create-function \
  --function-name "$LAMBDA_NAME" \
  --runtime nodejs20.x \
  --role "$ROLE_ARN" \
  --handler index.handler \
  --zip-file fileb://services/api-gateway-handler/dist/handler.zip \
  --region "$REGION" \
  --environment "Variables={TEAM_ID=$TEAM_ID,NODE_ENV=production,AWS_REGION=$REGION}" 2>/dev/null || \
aws lambda update-function-code \
  --function-name "$LAMBDA_NAME" \
  --zip-file fileb://services/api-gateway-handler/dist/handler.zip \
  --region "$REGION"

echo "Phase 1 deployment completed successfully!"
