"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_js_1.config.jwt.secret, {
        expiresIn: env_js_1.config.jwt.expiresIn,
    });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, env_js_1.config.jwt.secret);
}
