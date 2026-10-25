import { app } from './app.js';
import { config } from './config/env.js';

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Safety] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Safety] Uncaught Exception:', err);
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Navanagar Traffic Backend running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth/signup & /signin`);
  console.log(`👉 Traffic Lights: http://localhost:${PORT}/api/traffic-lights`);
  console.log(`👉 Cameras: http://localhost:${PORT}/api/cameras`);
});
