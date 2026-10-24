"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const traffic_light_controller_js_1 = require("../controllers/traffic-light.controller.js");
const router = (0, express_1.Router)();
router.get('/', traffic_light_controller_js_1.getAllTrafficLights);
router.post('/', traffic_light_controller_js_1.createTrafficLight);
router.delete('/:id', traffic_light_controller_js_1.deleteTrafficLight);
exports.default = router;
