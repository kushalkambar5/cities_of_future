import { app } from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Navanagar Traffic Backend running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth/signup & /signin`);
});
