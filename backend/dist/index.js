"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const PORT = env_js_1.config.port;
app_js_1.app.listen(PORT, () => {
    console.log(`🚀 Navanagar Traffic Backend running on port ${PORT}`);
    console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    console.log(`👉 Auth endpoints: http://localhost:${PORT}/api/auth/signup & /signin`);
});
