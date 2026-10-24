"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUp = signUp;
exports.signIn = signIn;
exports.getMe = getMe;
exports.updateProfile = updateProfile;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../db/index.js");
const schema_js_1 = require("../db/schema.js");
const password_utils_js_1 = require("../utils/password.utils.js");
const jwt_utils_js_1 = require("../utils/jwt.utils.js");
async function signUp(req, res, next) {
    try {
        const { name, email, password, phone, role } = req.body;
        // 1. Validation
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Name, email, and password are required',
            });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address',
            });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
            });
            return;
        }
        // Role validation (defaults to CITIZEN)
        const validRoles = ['CITIZEN', 'POLICE', 'ADMIN'];
        let assignedRole = 'CITIZEN';
        if (role && validRoles.includes(role.toUpperCase())) {
            assignedRole = role.toUpperCase();
        }
        // 2. Check if user already exists
        const existingUser = await index_js_1.db
            .select()
            .from(schema_js_1.users)
            .where((0, drizzle_orm_1.eq)(schema_js_1.users.email, cleanEmail))
            .limit(1);
        if (existingUser.length > 0) {
            res.status(409).json({
                success: false,
                message: 'An account with this email address already exists',
            });
            return;
        }
        // 3. Hash password & insert
        const passwordHash = await (0, password_utils_js_1.hashPassword)(password);
        const [newUser] = await index_js_1.db
            .insert(schema_js_1.users)
            .values({
            name: name.trim(),
            email: cleanEmail,
            passwordHash,
            phone: phone ? phone.trim() : null,
            role: assignedRole,
            status: 'ACTIVE',
        })
            .returning({
            id: schema_js_1.users.id,
            name: schema_js_1.users.name,
            email: schema_js_1.users.email,
            phone: schema_js_1.users.phone,
            role: schema_js_1.users.role,
            status: schema_js_1.users.status,
            createdAt: schema_js_1.users.createdAt,
        });
        // 4. Generate JWT
        const token = (0, jwt_utils_js_1.generateToken)({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
        });
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                token,
                user: newUser,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function signIn(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        // 1. Find user
        const [user] = await index_js_1.db
            .select()
            .from(schema_js_1.users)
            .where((0, drizzle_orm_1.eq)(schema_js_1.users.email, cleanEmail))
            .limit(1);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
            return;
        }
        // 2. Check status
        if (user.status === 'DISABLED') {
            res.status(403).json({
                success: false,
                message: 'Your account has been disabled. Please contact administrator.',
            });
            return;
        }
        // 3. Verify password
        const isPasswordValid = await (0, password_utils_js_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
            return;
        }
        // 4. Generate JWT
        const token = (0, jwt_utils_js_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Return sanitized user object
        const sanitizedUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
        };
        res.status(200).json({
            success: true,
            message: 'Signed in successfully',
            data: {
                token,
                user: sanitizedUser,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }
        const [user] = await index_js_1.db
            .select({
            id: schema_js_1.users.id,
            name: schema_js_1.users.name,
            email: schema_js_1.users.email,
            phone: schema_js_1.users.phone,
            role: schema_js_1.users.role,
            status: schema_js_1.users.status,
            createdAt: schema_js_1.users.createdAt,
        })
            .from(schema_js_1.users)
            .where((0, drizzle_orm_1.eq)(schema_js_1.users.id, req.user.userId))
            .limit(1);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: { user },
        });
    }
    catch (error) {
        next(error);
    }
}
async function updateProfile(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }
        const { name, phone } = req.body;
        const [updatedUser] = await index_js_1.db
            .update(schema_js_1.users)
            .set({
            ...(name && { name: name.trim() }),
            ...(phone !== undefined && { phone: phone.trim() }),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_js_1.users.id, req.user.userId))
            .returning({
            id: schema_js_1.users.id,
            name: schema_js_1.users.name,
            email: schema_js_1.users.email,
            phone: schema_js_1.users.phone,
            role: schema_js_1.users.role,
            status: schema_js_1.users.status,
            createdAt: schema_js_1.users.createdAt,
        });
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser },
        });
    }
    catch (error) {
        next(error);
    }
}
