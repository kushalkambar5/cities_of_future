"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanR2Key = cleanR2Key;
exports.getR2PublicUrl = getR2PublicUrl;
exports.uploadToR2 = uploadToR2;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_js_1 = require("../config/env.js");
let s3Client = null;
function getClient() {
    if (!s3Client) {
        if (!env_js_1.config.r2.endpoint || !env_js_1.config.r2.accessKeyId || !env_js_1.config.r2.secretAccessKey) {
            throw new Error('Cloudflare R2 credentials are not fully configured in backend environment');
        }
        s3Client = new client_s3_1.S3Client({
            region: 'auto',
            endpoint: env_js_1.config.r2.endpoint,
            credentials: {
                accessKeyId: env_js_1.config.r2.accessKeyId,
                secretAccessKey: env_js_1.config.r2.secretAccessKey,
            },
        });
    }
    return s3Client;
}
function cleanR2Key(keyOrUrl) {
    let key = keyOrUrl.trim();
    if (env_js_1.config.r2.publicUrl && key.startsWith(env_js_1.config.r2.publicUrl)) {
        key = key.substring(env_js_1.config.r2.publicUrl.length).replace(/^\/+/, '');
    }
    else if (key.startsWith('http://') || key.startsWith('https://')) {
        const parts = key.split('/');
        if (parts.length > 3) {
            key = parts.slice(3).join('/');
        }
    }
    return key.replace(/^\/+/, '');
}
function getR2PublicUrl(key) {
    const cleanKey = cleanR2Key(key);
    if (env_js_1.config.r2.publicUrl) {
        return `${env_js_1.config.r2.publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
    }
    return cleanKey;
}
async function uploadToR2(fileBuffer, destKey, contentType = 'application/octet-stream') {
    const client = getClient();
    const cleanKey = cleanR2Key(destKey);
    await client.send(new client_s3_1.PutObjectCommand({
        Bucket: env_js_1.config.r2.bucket,
        Key: cleanKey,
        Body: fileBuffer,
        ContentType: contentType,
    }));
    return {
        key: cleanKey,
        publicUrl: getR2PublicUrl(cleanKey),
    };
}
