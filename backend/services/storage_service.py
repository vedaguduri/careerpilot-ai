import os
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
from config import settings

class StorageService:
    """Hybrid Storage Service supporting Local Disk and S3-Compatible Cloud Object Storage (Cloudflare R2 / Supabase / AWS S3)."""

    def __init__(self):
        # Cloudflare R2 / S3 Credentials from environment
        self.endpoint_url = os.getenv("R2_ENDPOINT_URL") or os.getenv("S3_ENDPOINT_URL")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME") or os.getenv("S3_BUCKET_NAME", "careerpilot-resumes")
        self.public_domain = os.getenv("R2_PUBLIC_DOMAIN") # e.g. https://pub-xxx.r2.dev

        self._s3_client = None
        if self.endpoint_url and self.access_key and self.secret_key:
            try:
                import boto3
                self._s3_client = boto3.client(
                    's3',
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    region_name='auto'
                )
            except Exception as e:
                print(f"S3/R2 client initialization skipped: {e}")

    @property
    def is_cloud_storage(self) -> bool:
        return self._s3_client is not None

    def save_file(
        self, 
        content: bytes, 
        filename: str, 
        user_id: str, 
        category: str = "master"
    ) -> Dict[str, str]:
        """Saves file to Cloudflare R2 / S3 if configured, or local persistent storage."""
        ext = filename.split(".")[-1].lower() if "." in filename else "bin"
        unique_name = f"{category}_{uuid.uuid4().hex[:10]}.{ext}"
        object_key = f"users/{user_id}/{category}/{unique_name}"

        # 1. Cloudflare R2 / S3 Storage
        if self._s3_client:
            try:
                self._s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=object_key,
                    Body=content,
                    ContentType="application/pdf" if ext == "pdf" else "application/octet-stream"
                )
                url = f"{self.public_domain}/{object_key}" if self.public_domain else f"/api/resumes/download/{unique_name}"
                return {
                    "storage_type": "s3_r2",
                    "file_path": object_key,
                    "download_url": url,
                    "filename": filename
                }
            except Exception as e:
                print(f"Failed to upload to R2/S3, falling back to local: {e}")

        # 2. Local Storage Fallback
        target_dir = settings.UPLOADS_DIR if category == "master" else settings.GENERATED_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        local_path = target_dir / unique_name

        with open(local_path, "wb") as f:
            f.write(content)

        return {
            "storage_type": "local",
            "file_path": str(local_path),
            "download_url": f"/api/resumes/file/{unique_name}",
            "filename": filename
        }

    def get_file_bytes(self, file_path: str) -> Optional[bytes]:
        """Reads raw bytes from cloud storage or local disk."""
        if self._s3_client and not Path(file_path).is_absolute() and "users/" in file_path:
            try:
                res = self._s3_client.get_object(Bucket=self.bucket_name, Key=file_path)
                return res['Body'].read()
            except Exception as e:
                print(f"Error fetching from R2/S3: {e}")
                return None

        # Local read
        path = Path(file_path)
        if path.exists():
            with open(path, "rb") as f:
                return f.read()
        return None

storage_service = StorageService()
