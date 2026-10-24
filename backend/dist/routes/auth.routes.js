"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public routes
router.post('/signup', auth_controller_js_1.signUp);
router.post('/signin', auth_controller_js_1.signIn);
// Protected routes
router.get('/me', auth_middleware_js_1.authenticate, auth_controller_js_1.getMe);
router.put('/profile', auth_middleware_js_1.authenticate, auth_controller_js_1.updateProfile);
exports.default = router;
