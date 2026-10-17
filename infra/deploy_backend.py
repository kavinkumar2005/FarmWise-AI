"""
FarmwiseAI Backend Deployment Script to AWS Lambda & API Gateway.
Deploys fai-tce-team06-api-gateway-handler and creates HTTP API Gateway.
"""
import os
import sys
import json
import boto3
from pathlib import Path
from dotenv import load_dotenv

# Load fresh credentials from backend/.env or .env.deploy
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

region = os.getenv("AWS_REGION", "ap-south-1")
access_key = os.getenv("AWS_ACCESS_KEY_ID")
secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
session_token = os.getenv("AWS_SESSION_TOKEN")

if not access_key or not secret_key:
    print("ERROR: AWS credentials not found!")
    sys.exit(1)

session = boto3.Session(
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    aws_session_token=session_token,
    region_name=region
)

lambda_client = session.client("lambda")
apigw_client = session.client("apigatewayv2")

function_name = "fai-tce-team06-api-gateway-handler"
role_arn = "arn:aws:iam::100247989552:role/FAI-TCE-LambdaExecutionRole"
zip_path = Path(__file__).parent.parent / "services" / "api-gateway-handler" / "dist" / "handler.zip"

if not zip_path.exists():
    print(f"ERROR: {zip_path} does not exist!")
    sys.exit(1)

with open(zip_path, "rb") as f:
    zip_bytes = f.read()

print(f"Deploying Lambda '{function_name}' ({len(zip_bytes)} bytes) to {region}...")

# 1. Create or Update Lambda Function
fn_arn = None
try:
    # Check if exists
    lambda_client.get_function(FunctionName=function_name)
    print(f"Function {function_name} exists. Updating function code...")
    res = lambda_client.update_function_code(
        FunctionName=function_name,
        ZipFile=zip_bytes
    )
    fn_arn = res["FunctionArn"]
    print(f"[OK] Function code updated successfully: {fn_arn}")
except lambda_client.exceptions.ResourceNotFoundException:
    print(f"Function {function_name} does not exist. Creating function...")
    res = lambda_client.create_function(
        FunctionName=function_name,
        Runtime="nodejs20.x",
        Role=role_arn,
        Handler="index.handler",
        Code={"ZipFile": zip_bytes},
        Description="FarmwiseAI Agentic Intelligence Platform API Gateway Handler",
        Timeout=60,
        MemorySize=512,
        Publish=True,
        Environment={
            "Variables": {
                "TEAM_ID": "06",
                "NODE_ENV": "production",
                "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY", ""),
                "GROQ_API_KEY": os.getenv("GROQ_API_KEY", "")
            }
        }
    )
    fn_arn = res["FunctionArn"]
    print(f"[OK] Function created successfully: {fn_arn}")
except Exception as e:
    print(f"Error creating/updating Lambda: {e}")
    sys.exit(1)

# Wait for function to be active
waiter = lambda_client.get_waiter("function_updated")
try:
    print("Waiting for Lambda update to complete...")
    waiter.wait(FunctionName=function_name)
except Exception:
    pass

# 2. Create or Configure API Gateway (HTTP API)
api_name = "fai-tce-team06-api"
api_endpoint = None
print(f"\nConfiguring API Gateway ({api_name})...")
try:
    apis = apigw_client.get_apis()["Items"]
    existing_api = next((a for a in apis if a["Name"] == api_name), None)
    
    if existing_api:
        api_id = existing_api["ApiId"]
        api_endpoint = existing_api["ApiEndpoint"]
        print(f"[OK] Existing API Gateway found: {api_endpoint} (ID: {api_id})")
    else:
        print("Creating new HTTP API Gateway...")
        new_api = apigw_client.create_api(
            Name=api_name,
            ProtocolType="HTTP",
            Target=fn_arn,
            CorsConfiguration={
                "AllowOrigins": ["*"],
                "AllowMethods": ["GET", "POST", "OPTIONS"],
                "AllowHeaders": ["*"]
            }
        )
        api_id = new_api["ApiId"]
        api_endpoint = new_api["ApiEndpoint"]
        print(f"[OK] Created API Gateway: {api_endpoint} (ID: {api_id})")

    # Add permission for API Gateway to invoke Lambda
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId="ApiGatewayInvokePermission",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{region}:100247989552:{api_id}/*"
        )
        print("[OK] Granted API Gateway permission to invoke Lambda")
    except lambda_client.exceptions.ResourceConflictException:
        print("[OK] API Gateway invoke permission already exists")
    except Exception as e:
        print(f"Notice on API Gateway permission: {e}")

except Exception as e:
    print(f"API Gateway notice: {e}")

# 4. Test invoking the Lambda
print("\nTesting Lambda invocation (GET /health)...")
try:
    test_event = {
        "rawPath": "/health",
        "path": "/health",
        "httpMethod": "GET",
        "requestContext": {
            "http": {
                "method": "GET",
                "path": "/health"
            }
        }
    }
    invoke_res = lambda_client.invoke(
        FunctionName=function_name,
        Payload=json.dumps(test_event)
    )
    payload_str = invoke_res["Payload"].read().decode("utf-8")
    print(f"Response Status: {invoke_res['StatusCode']}")
    print(f"Response Payload:\n{payload_str[:300]}...")
except Exception as e:
    print(f"Test invocation error: {e}")

print("\n========================================================")
print(" DEPLOYMENT COMPLETE!")
print(f" Lambda Function ARN: {fn_arn}")
if api_endpoint:
    print(f" API Gateway Endpoint: {api_endpoint}")
print("========================================================")
