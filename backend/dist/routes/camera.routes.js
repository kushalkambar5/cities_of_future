"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const camera_controller_js_1 = require("../controllers/camera.controller.js");
const router = (0, express_1.Router)();
router.get('/', camera_controller_js_1.getAllCameras);
router.post('/', camera_controller_js_1.createCamera);
router.delete('/:id', camera_controller_js_1.deleteCamera);
exports.default = router;
