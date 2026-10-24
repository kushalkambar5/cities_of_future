import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Locate .env in backend directory or current working directory
const possiblePaths = [
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve('E:/Codes/cities_of_future/backend/.env'),
];

for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl:
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cities_of_future',
  jwt: {
    secret: process.env.JWT_SECRET || 'navanagar_smart_traffic_jwt_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  },
  r2: {
    bucket: process.env.R2_BUCKET || 'onbillo',
    publicUrl: process.env.R2_PUBLIC_URL || 'https://pub-cfc018712725461fa8bcd1c2e0a4a1e7.r2.dev',
    endpoint: process.env.R2_ENDPOINT || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  openwa: {
    url: (process.env.OPENWA_SERVER_URL || 'http://localhost:2785/api').replace(/\/+$/, ''),
    apiKey: process.env.OPENWA_API_KEY || '',
  },
  fastapi: {
    url: (process.env.FASTAPI_ML_SERVICE_URL || 'http://127.0.0.1:8005').replace(/\/+$/, ''),
  },
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1',
    model: process.env.OPENAI_MODEL || 'openai/gpt-oss-120b',
  },
};
