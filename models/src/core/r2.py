import logging
import os
from pathlib import Path
from typing import Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from ..config import settings

logger = logging.getLogger("cotf.ml.r2")


def get_r2_client():
    """Initializes and returns a boto3 S3 client configured for Cloudflare R2."""
    if not (settings.R2_ENDPOINT and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY):
        raise ValueError(
            "Cloudflare R2 credentials (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not configured."
        )

    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def clean_r2_key(key_or_url: str) -> str:
    """Extract clean object key whether user provided full URL or key path."""
    key = key_or_url.strip()
    if settings.R2_PUBLIC_URL and key.startswith(settings.R2_PUBLIC_URL):
        key = key[len(settings.R2_PUBLIC_URL):].lstrip("/")
    elif key.startswith("http://") or key.startswith("https://"):
        # Strip origin domain
        parts = key.split("/", 3)
        if len(parts) > 3:
            key = parts[3]
    return key.lstrip("/")


def download_file_from_r2(key_or_url: str, dest_path: str) -> str:
    """Download an object from Cloudflare R2 into a local file destination."""
    client = get_r2_client()
    key = clean_r2_key(key_or_url)
    bucket = settings.R2_BUCKET

    logger.info(f"Downloading R2 key '{key}' from bucket '{bucket}' to '{dest_path}'...")
    os.makedirs(os.path.dirname(dest_path) or ".", exist_ok=True)
    try:
        client.download_file(bucket, key, dest_path)
    except ClientError as e:
        logger.error(f"Failed to download R2 object '{key}': {e}")
        raise FileNotFoundError(f"Could not find or download R2 object: {key}") from e

    logger.info(f"Successfully downloaded R2 object '{key}'.")
    return dest_path


def upload_file_to_r2(
    source_path: str,
    dest_key: str,
    content_type: str = "video/mp4",
) -> str:
    """Upload a local file to Cloudflare R2 and return the public URL if configured."""
    client = get_r2_client()
    key = clean_r2_key(dest_key)
    bucket = settings.R2_BUCKET

    if not os.path.isfile(source_path):
        raise FileNotFoundError(f"Local file to upload not found: {source_path}")

    logger.info(f"Uploading '{source_path}' to R2 bucket '{bucket}' with key '{key}'...")
    extra_args = {"ContentType": content_type}
    client.upload_file(source_path, bucket, key, ExtraArgs=extra_args)
    logger.info(f"Successfully uploaded to R2 key '{key}'.")

    if settings.R2_PUBLIC_URL:
        public_base = settings.R2_PUBLIC_URL.rstrip("/")
        return f"{public_base}/{key}"
    return key
