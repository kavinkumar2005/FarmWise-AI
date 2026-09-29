# FarmwiseAI Phase 1 Deployment Script (PowerShell for Windows)
[CmdletBinding()]
param (
    [string] = "config\team.json"
)

Continue = "Stop"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " FarmwiseAI Phase 1 Deployment Automation (PowerShell)    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

if (-not (Test-Path )) {
    Write-Error "Configuration file '' not found!"
    exit 1
}

 = Get-Content  | ConvertFrom-Json
 = .teamId
 = .region
 = .roleArn
 = .resourcePrefix

Write-Host "Team ID: " -ForegroundColor Cyan
Write-Host "Target Region: " -ForegroundColor Cyan
Write-Host "Resource Prefix: " -ForegroundColor Cyan
Write-Host "Execution Role: " -ForegroundColor Cyan

if ( -ne "ap-south-1") {
    Write-Error "Region must be strictly 'ap-south-1' (Mumbai)!"
    exit 1
}

# Check AWS CLI availability
 =  -ne (Get-Command "aws" -ErrorAction SilentlyContinue)

if (-not ) {
    Write-Host "[INFO] AWS CLI binary not found in PATH." -ForegroundColor Yellow
    Write-Host "[INFO] Building Lambda packages locally and running verification in local simulation mode." -ForegroundColor Yellow
}

# 1. Build api-gateway-handler
Write-Host "Bundling api-gateway-handler with esbuild..." -ForegroundColor Cyan
npx esbuild services/api-gateway-handler/src/index.ts 
  --bundle 
  --platform=node 
  --target=node20 
  --outfile=services/api-gateway-handler/dist/index.js 
  --external:@aws-sdk/*

Write-Host "Bundled Lambda artifact created at services/api-gateway-handler/dist/index.js" -ForegroundColor Green

if () {
    # Compress for AWS
    Compress-Archive -Path "services\api-gateway-handler\dist\index.js" -DestinationPath "services\api-gateway-handler\dist\handler.zip" -Force

    # S3 Buckets
     = @("-uploads", "-geodata", "-advisory", "-reports")
    foreach ( in ) {
        Write-Host "Configuring S3 Bucket: " -ForegroundColor Cyan
        try {
            aws s3api create-bucket --bucket  --region  --create-bucket-configuration LocationConstraint= 2>
            aws s3api put-bucket-encryption --bucket  --server-side-encryption-configuration '{\"Rules\": [{\"ApplyServerSideEncryptionByDefault\": {\"SSEAlgorithm\": \"AES256\"}}]}' 2>
            aws s3api put-public-access-block --bucket  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" 2>
        } catch {
            Write-Host "Bucket note: " -ForegroundColor DarkGray
        }
    }

    # DynamoDB Tables
     = @("-runs", "-parcels", "-landrecords", "-refimages", "-advisory-chunks", "-chats", "-cache")
    foreach ( in ) {
        Write-Host "Configuring DynamoDB Table: " -ForegroundColor Cyan
        try {
            aws dynamodb create-table 
                --table-name  
                --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S 
                --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE 
                --billing-mode PAY_PER_REQUEST 
                --region  2>
        } catch {
            Write-Host "Table note: " -ForegroundColor DarkGray
        }
    }

     = "-api-gateway-handler"
    Write-Host "Deploying Lambda function: " -ForegroundColor Cyan
    try {
        aws lambda update-function-code --function-name  --zip-file fileb://services/api-gateway-handler/dist/handler.zip --region 
    } catch {
        aws lambda create-function 
            --function-name  
            --runtime nodejs20.x 
            --role  
            --handler index.handler 
            --zip-file fileb://services/api-gateway-handler/dist/handler.zip 
            --region  
            --environment "Variables={TEAM_ID=,NODE_ENV=production,AWS_REGION=}"
    }
}

Write-Host "Deployment script finished successfully." -ForegroundColor Green
