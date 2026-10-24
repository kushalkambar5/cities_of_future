import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { config } from '../config/env.js';

let s3Client: S3Client | null = null;

function getClient(): S3Client {
  if (!s3Client) {
    if (!config.r2.endpoint || !config.r2.accessKeyId || !config.r2.secretAccessKey) {
      throw new Error('Cloudflare R2 credentials are not fully configured in backend environment');
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    });
  }
  return s3Client;
}

export function cleanR2Key(keyOrUrl: string): string {
  let key = keyOrUrl.trim();
  if (config.r2.publicUrl && key.startsWith(config.r2.publicUrl)) {
    key = key.substring(config.r2.publicUrl.length).replace(/^\/+/, '');
  } else if (key.startsWith('http://') || key.startsWith('https://')) {
    const parts = key.split('/');
    if (parts.length > 3) {
      key = parts.slice(3).join('/');
    }
  }
  return key.replace(/^\/+/, '');
}

export function getR2PublicUrl(key: string): string {
  const cleanKey = cleanR2Key(key);
  if (config.r2.publicUrl) {
    return `${config.r2.publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }
  return cleanKey;
}

export async function uploadToR2(
  fileBuffer: Buffer,
  destKey: string,
  contentType: string = 'application/octet-stream'
): Promise<{ key: string; publicUrl: string }> {
  const client = getClient();
  const cleanKey = cleanR2Key(destKey);

  await client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucket,
      Key: cleanKey,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return {
    key: cleanKey,
    publicUrl: getR2PublicUrl(cleanKey),
  };
}
