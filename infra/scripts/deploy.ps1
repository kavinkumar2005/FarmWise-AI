# FarmwiseAI Phase 1 Deployment Script (PowerShell for Windows)
[CmdletBinding()]
param (
    [string]$ConfigFile = "config/team.json",
    [string]$EnvFile = ".env.deploy"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " FarmwiseAI Phase 1 Deployment Automation (PowerShell)    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# 1. Load .env.deploy if present
if (Test-Path $EnvFile) {
    Write-Host "[INFO] Loading environment variables from $EnvFile..." -ForegroundColor Cyan
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $varName = $parts[0].Trim()
            $varVal = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($varName, $varVal, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

if (-not (Test-Path $ConfigFile)) {
    Write-Error "Configuration file '$ConfigFile' not found!"
    exit 1
}

$config = Get-Content $ConfigFile | ConvertFrom-Json
$teamId = $config.teamId
$region = $config.region
$roleArn = $config.roleArn
$resourcePrefix = $config.resourcePrefix

Write-Host "Team ID: $teamId" -ForegroundColor Cyan
Write-Host "Target Region: $region" -ForegroundColor Cyan
Write-Host "Resource Prefix: $resourcePrefix" -ForegroundColor Cyan
Write-Host "Execution Role: $roleArn" -ForegroundColor Cyan

if ($region -ne "ap-south-1") {
    Write-Error "Region must be strictly 'ap-south-1' (Mumbai)!"
    exit 1
}

# Check AWS CLI availability
$hasAwsCli = $null -ne (Get-Command "aws" -ErrorAction SilentlyContinue)

# 1. Build api-gateway-handler with esbuild
Write-Host "Bundling api-gateway-handler with esbuild..." -ForegroundColor Cyan
npx esbuild services/api-gateway-handler/src/index.ts `
  --bundle `
  --platform=node `
  --target=node20 `
  --outfile=services/api-gateway-handler/dist/index.js `
  --external:@aws-sdk/*

Write-Host "Bundled Lambda artifact created at services/api-gateway-handler/dist/index.js" -ForegroundColor Green

# Ensure destination directory for zip
$distDir = "services\api-gateway-handler\dist"
if (Test-Path "$distDir\index.js") {
    Compress-Archive -Path "$distDir\index.js" -DestinationPath "$distDir\handler.zip" -Force
    Write-Host "Created Lambda package at $distDir\handler.zip" -ForegroundColor Green
}

if (-not $hasAwsCli) {
    Write-Host "[INFO] AWS CLI binary not found in PATH." -ForegroundColor Yellow
    Write-Host "[INFO] Build and packaging completed. Run with AWS CLI installed or deploy via AWS Console / CloudShell." -ForegroundColor Yellow
} else {
    Write-Host "AWS CLI detected. Provisioning resources..." -ForegroundColor Green
    
    # S3 Buckets
    $buckets = @("$resourcePrefix-uploads", "$resourcePrefix-geodata", "$resourcePrefix-advisory", "$resourcePrefix-reports")
    foreach ($bucket in $buckets) {
        Write-Host "Configuring S3 Bucket: $bucket" -ForegroundColor Cyan
        try {
            aws s3api create-bucket --bucket $bucket --region $region --create-bucket-configuration LocationConstraint=$region 2>$null
            aws s3api put-bucket-encryption --bucket $bucket --server-side-encryption-configuration '{\"Rules\": [{\"ApplyServerSideEncryptionByDefault\": {\"SSEAlgorithm\": \"AES256\"}}]}' 2>$null
            aws s3api put-public-access-block --bucket $bucket --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" 2>$null
        } catch {
            Write-Host "Bucket note for $($bucket): $($_.Exception.Message)" -ForegroundColor DarkGray
        }
    }

    # DynamoDB Tables
    $tables = @("$resourcePrefix-runs", "$resourcePrefix-parcels", "$resourcePrefix-landrecords", "$resourcePrefix-refimages", "$resourcePrefix-advisory-chunks", "$resourcePrefix-chats", "$resourcePrefix-cache")
    foreach ($table in $tables) {
        Write-Host "Configuring DynamoDB Table: $table" -ForegroundColor Cyan
        try {
            aws dynamodb create-table `
                --table-name $table `
                --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S `
                --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE `
                --billing-mode PAY_PER_REQUEST `
                --region $region 2>$null
        } catch {
            Write-Host "Table note for $($table): $($_.Exception.Message)" -ForegroundColor DarkGray
        }
    }

    $lambdaName = "$resourcePrefix-api-gateway-handler"
    Write-Host "Deploying Lambda function: $lambdaName" -ForegroundColor Cyan
    try {
        aws lambda update-function-code --function-name $lambdaName --zip-file "fileb://$distDir/handler.zip" --region $region
    } catch {
        aws lambda create-function `
            --function-name $lambdaName `
            --runtime nodejs20.x `
            --role $roleArn `
            --handler index.handler `
            --zip-file "fileb://$distDir/handler.zip" `
            --region $region `
            --environment "Variables={TEAM_ID=$teamId,NODE_ENV=production,AWS_REGION=$region}"
    }
}

Write-Host "Deployment script finished successfully." -ForegroundColor Green
