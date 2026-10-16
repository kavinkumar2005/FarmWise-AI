import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from pathlib import Path
from typing import Optional, Dict, Any
from app.config import settings

class AWSService:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.region = settings.AWS_REGION
        self._s3_client = None
        self._init_client()

    def _init_client(self):
        try:
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                session = boto3.Session(
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    aws_session_token=settings.AWS_SESSION_TOKEN if settings.AWS_SESSION_TOKEN else None,
                    region_name=self.region
                )
                self._s3_client = session.client('s3')
                print("[INFO] AWS S3 client initialized with ap-south-1 credentials.")
        except Exception as e:
            print(f"[WARN] AWS Client init warning: {e}")
            self._s3_client = None

    def upload_image(self, file_path: str, object_name: Optional[str] = None) -> Optional[str]:
        """Uploads image to S3 bucket or falls back to local storage."""
        if object_name is None:
            object_name = f"fai-tce-team06-crops/{Path(file_path).name}"

        # Try S3 upload if client is available
        if self._s3_client:
            try:
                self._s3_client.upload_file(file_path, self.bucket_name, object_name)
                url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{object_name}"
                print(f"[OK] Uploaded to AWS S3: {url}")
                return url
            except Exception as e:
                print(f"[WARN] S3 Upload notice ({e}). Utilizing reliable local artifact serving.")

        # Local fallback URL
        return f"/uploads/{Path(file_path).name}"

    def list_storage_objects(self, bucket_name: Optional[str] = None) -> Dict[str, Any]:
        """Lists objects in the team S3 bucket with metadata and temporary presigned URLs."""
        target_bucket = bucket_name or self.bucket_name
        if not self._s3_client:
            return {"bucket": target_bucket, "status": "no_credentials", "objects": [], "total_count": 0}

        try:
            paginator = self._s3_client.get_paginator("list_objects_v2")
            objects = []
            total_size_bytes = 0

            for page in paginator.paginate(Bucket=target_bucket):
                for item in page.get("Contents", []):
                    key = item["Key"]
                    size = item["Size"]
                    total_size_bytes += size
                    
                    # Generate temporary presigned URL for viewing
                    try:
                        view_url = self._s3_client.generate_presigned_url(
                            "get_object",
                            Params={"Bucket": target_bucket, "Key": key},
                            ExpiresIn=3600
                        )
                    except Exception:
                        view_url = None

                    objects.append({
                        "key": key,
                        "size_bytes": size,
                        "size_kb": round(size / 1024, 2),
                        "last_modified": item["LastModified"].isoformat(),
                        "view_url": view_url
                    })

            return {
                "bucket": target_bucket,
                "region": self.region,
                "total_count": len(objects),
                "total_size_kb": round(total_size_bytes / 1024, 2),
                "objects": objects
            }
        except Exception as e:
            return {"bucket": target_bucket, "status": "error", "message": str(e), "objects": [], "total_count": 0}

    def check_bedrock_availability(self) -> Dict[str, Any]:
        """Checks Amazon Bedrock model availability in ap-south-1."""
        try:
            session = boto3.Session(
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                aws_session_token=settings.AWS_SESSION_TOKEN if settings.AWS_SESSION_TOKEN else None,
                region_name=self.region
            )
            bedrock = session.client('bedrock')
            models = bedrock.list_foundation_models()
            allowed_models = [
                m['modelId'] for m in models.get('modelSummaries', [])
                if any(x in m['modelId'].lower() for x in ['ministral', 'titan'])
            ]
            return {"status": "available", "models": allowed_models}
        except Exception as e:
            return {"status": "session_expired_or_restricted", "error": str(e)}

aws_service = AWSService()
