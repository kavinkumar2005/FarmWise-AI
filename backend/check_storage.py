"""
Utility script to view all files stored in AWS S3 buckets for Team 06.
Run with: python backend/check_storage.py
"""
import os
import boto3
from dotenv import load_dotenv

# Load credentials from backend/.env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

region = os.getenv("AWS_REGION", "ap-south-1")
s3 = boto3.client("s3", region_name=region)

print(f"Connecting to AWS S3 (Region: {region})...\n")

try:
    all_buckets = s3.list_buckets().get("Buckets", [])
    team_buckets = [b["Name"] for b in all_buckets if "team06" in b["Name"]]
    
    if not team_buckets:
        print("No buckets found with prefix 'team06'. Listing all buckets:")
        team_buckets = [b["Name"] for b in all_buckets]

    for bucket in team_buckets:
        print(f"==================================================")
        print(f" Bucket: s3://{bucket}")
        print(f"==================================================")
        
        paginator = s3.get_paginator("list_objects_v2")
        total_size = 0
        file_count = 0
        
        for page in paginator.paginate(Bucket=bucket):
            for item in page.get("Contents", []):
                file_count += 1
                size_kb = item["Size"] / 1024
                total_size += item["Size"]
                modified = item["LastModified"].strftime("%Y-%m-%d %H:%M:%S")
                key = item["Key"]
                print(f"  * {key:<45} | {size_kb:>8.2f} KB | {modified}")
                
                # If image or text, generate a 1-hour presigned URL to open in browser
                try:
                    url = s3.generate_presigned_url(
                        "get_object",
                        Params={"Bucket": bucket, "Key": key},
                        ExpiresIn=3600
                    )
                    print(f"    -> View/Download: {url[:100]}...")
                except Exception:
                    pass
                
        if file_count == 0:
            print("  (Bucket is currently empty)")
        else:
            print(f"\n  Total: {file_count} file(s) ({total_size / 1024:.2f} KB)\n")

except Exception as e:
    print(f"Error accessing S3: {e}")
