"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agents_1 = require("@openai/agents");
const zod_1 = require("zod");
const index_js_1 = require("../db/index.js");
const jwt_utils_js_1 = require("../utils/jwt.utils.js");
const env_js_1 = require("../config/env.js");
const router = (0, express_1.Router)();
// Ensure OpenAI / Groq keys and provider are initialized for @openai/agents
const GROQ_KEY = process.env.GROQ_API_KEY || env_js_1.config.openai.apiKey || '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';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const AGENT_MODEL = 'qwen/qwen3.8-27b';
// Set environment variables explicitly for any internal SDK consumers
process.env.OPENAI_API_KEY = GROQ_KEY;
process.env.OPENAI_BASE_URL = GROQ_BASE_URL;
try {
    const provider = new agents_1.OpenAIProvider({
        apiKey: GROQ_KEY,
        baseURL: GROQ_BASE_URL,
    });
    (0, agents_1.setDefaultModelProvider)(provider);
    console.log(`[OpenAI Agent SDK] Initialized with Groq LPU provider (model: ${AGENT_MODEL})`);
}
catch (provErr) {
    console.warn('[OpenAI Agent SDK Provider Init]', provErr.message);
}
function truncateText(str, maxLen = 300) {
    if (!str)
        return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
function normalizeStoredChats(raw) {
    let arr = raw;
    if (typeof arr === 'string') {
        try {
            arr = JSON.parse(arr);
        }
        catch {
            return [];
        }
    }
    if (!Array.isArray(arr))
        return [];
    return arr.slice(-10).map((c) => ({
        chat_text: String(c.chat_text || c.text || c.content || '').trim(),
        created_at: c.created_at || c.timestamp || new Date().toISOString(),
        created_by: c.created_by === 'ai' || c.role === 'assistant' ? 'ai' : 'user',
    }));
}
function extractAuthUser(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            return (0, jwt_utils_js_1.verifyToken)(token);
        }
        catch {
            return null;
        }
    }
    return null;
}
function resolveUserId(req, fallbackId) {
    const auth = extractAuthUser(req);
    if (auth?.userId)
        return auth.userId;
    const headerId = req.headers['x-user-id'];
    if (headerId && !isNaN(Number(headerId)))
        return Number(headerId);
    const qId = req.query.userId || req.query.patientId;
    if (qId && !isNaN(Number(qId)))
        return Number(qId);
    if (fallbackId && !isNaN(Number(fallbackId)))
        return Number(fallbackId);
    return null;
}
// ============================================================================
// OPENAI AGENT TOOLS (ROLE-BASED TRAFFIC CAPABILITIES)
// ============================================================================
// 1. Citizen Tool: Get Own Vehicles
const getMyVehiclesTool = (0, agents_1.tool)({
    name: 'getMyVehicles',
    description: 'Retrieve registered vehicles owned by the authenticated citizen.',
    parameters: zod_1.z.object({
        userId: zod_1.z.number().describe('ID of the citizen user'),
    }),
    execute: async ({ userId }) => {
        try {
            const res = await index_js_1.pool.query('SELECT id, plate_number, vehicle_type, created_at FROM vehicles WHERE owner_id = $1 ORDER BY id ASC', [userId]);
            return res.rows.length > 0
                ? res.rows
                : { notice: 'You currently have no registered vehicles on file in Navanagar.' };
        }
        catch (err) {
            return { error: `Database error: ${err.message}` };
        }
    },
});
// 2. Citizen Tool: Get Own Violations & Fines
const getMyViolationsTool = (0, agents_1.tool)({
    name: 'getMyViolations',
    description: 'Retrieve traffic violations, challans, fine amounts, and payment statuses for the citizen.',
    parameters: zod_1.z.object({
        userId: zod_1.z.number().describe('ID of the citizen user'),
    }),
    execute: async ({ userId }) => {
        try {
            const query = `
        SELECT 
          v.id AS violation_id,
          v.type AS violation_type,
          v.status AS violation_status,
          v.description,
          v.created_at,
          veh.plate_number,
          veh.vehicle_type,
          f.id AS fine_id,
          f.amount AS fine_amount,
          f.status AS fine_status,
          f.paid_at
        FROM violations v
        JOIN vehicles veh ON veh.id = v.vehicle_id
        LEFT JOIN fines f ON f.violation_id = v.id
        WHERE veh.owner_id = $1
        ORDER BY v.id DESC
        LIMIT 10
      `;
            const res = await index_js_1.pool.query(query, [userId]);
            return res.rows.length > 0
                ? res.rows
                : { notice: 'Great news! No traffic violations or pending fines found for your vehicles.' };
        }
        catch (err) {
            return { error: `Database error: ${err.message}` };
        }
    },
});
// 3. Police & Admin Tool: Lookup Vehicle by Plate
const lookupVehicleTool = (0, agents_1.tool)({
    name: 'lookupVehicleByPlate',
    description: 'Search any vehicle by its license plate number to see owner name, phone number, and violations history. (Police/Admin only)',
    parameters: zod_1.z.object({
        plateNumber: zod_1.z.string().describe('License plate number to lookup'),
    }),
    execute: async ({ plateNumber }) => {
        try {
            const cleanPlate = String(plateNumber).trim().toUpperCase();
            const vehRes = await index_js_1.pool.query(`SELECT v.id, v.plate_number, v.vehicle_type, u.id AS owner_id, u.name AS owner_name, u.phone AS owner_phone, u.email AS owner_email
         FROM vehicles v
         LEFT JOIN users u ON u.id = v.owner_id
         WHERE v.plate_number ILIKE $1`, [`%${cleanPlate}%`]);
            if (vehRes.rows.length === 0) {
                return { notice: `No vehicle found matching plate '${cleanPlate}'.` };
            }
            const vehicle = vehRes.rows[0];
            const viosRes = await index_js_1.pool.query(`SELECT v.id, v.type, v.status, f.amount, f.status AS fine_status, v.created_at
         FROM violations v
         LEFT JOIN fines f ON f.violation_id = v.id
         WHERE v.vehicle_id = $1
         ORDER BY v.id DESC
         LIMIT 5`, [vehicle.id]);
            return {
                vehicle,
                recentViolations: viosRes.rows,
            };
        }
        catch (err) {
            return { error: `Lookup failed: ${err.message}` };
        }
    },
});
// 4. Police & Admin Tool: Traffic Violations Summary
const getCityViolationsSummaryTool = (0, agents_1.tool)({
    name: 'getCityViolationsSummary',
    description: 'Retrieve summary of recent traffic violations across the city, filtered by payment status (PAID/UNPAID) or violation type. (Police/Admin only)',
    parameters: zod_1.z.object({
        status: zod_1.z.string().optional().describe('Filter by fine status: ALL, UNPAID, or PAID'),
        type: zod_1.z.string().optional().describe('Optional violation type: OVERSPEED, NO_HELMET, WRONG_SIDE, RED_LIGHT'),
    }),
    execute: async ({ status, type }) => {
        try {
            const conditions = ['1=1'];
            const params = [];
            let idx = 1;
            if (status && status !== 'ALL') {
                conditions.push(`f.status = $${idx++}`);
                params.push(status.toUpperCase());
            }
            if (type && type !== 'ALL') {
                conditions.push(`v.type = $${idx++}`);
                params.push(type.toUpperCase());
            }
            const sql = `
        SELECT 
          v.id, v.type, v.status AS violation_status, veh.plate_number,
          u.name AS citizen_name, u.phone AS citizen_phone,
          f.amount, f.status AS fine_status, v.created_at
        FROM violations v
        LEFT JOIN fines f ON f.violation_id = v.id
        LEFT JOIN vehicles veh ON veh.id = v.vehicle_id
        LEFT JOIN users u ON u.id = veh.owner_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY v.id DESC
        LIMIT 10
      `;
            const res = await index_js_1.pool.query(sql, params);
            return res.rows;
        }
        catch (err) {
            return { error: `Database error: ${err.message}` };
        }
    },
});
// 5. Police & Admin Tool: Cameras and Junctions Status
const getCamerasStatusTool = (0, agents_1.tool)({
    name: 'getCamerasStatus',
    description: 'Get operational statuses, speed limits, and locations of CCTV surveillance cameras and traffic signals. (Police/Admin only)',
    parameters: zod_1.z.object({}),
    execute: async () => {
        try {
            const res = await index_js_1.pool.query('SELECT id, name, speed_limit, status, latitude, longitude FROM cameras ORDER BY id ASC');
            return res.rows;
        }
        catch (err) {
            return { error: `Database error: ${err.message}` };
        }
    },
});
// 6. Admin Tool: System Intelligence Overview
const getSystemOverviewTool = (0, agents_1.tool)({
    name: 'getSystemOverview',
    description: 'Retrieve city-wide smart traffic statistics including total registered vehicles, total fines, revenue collected, and AI verification rates. (Admin only)',
    parameters: zod_1.z.object({}),
    execute: async () => {
        try {
            const vehCount = await index_js_1.pool.query('SELECT count(*) FROM vehicles');
            const userCount = await index_js_1.pool.query('SELECT count(*) FROM users');
            const camCount = await index_js_1.pool.query('SELECT count(*) FROM cameras');
            const viosCount = await index_js_1.pool.query('SELECT status, count(*) FROM violations GROUP BY status');
            const finesRes = await index_js_1.pool.query("SELECT status, count(*), COALESCE(SUM(amount), 0) AS total_amount FROM fines GROUP BY status");
            return {
                totalRegisteredVehicles: parseInt(vehCount.rows[0].count, 10),
                totalCitizensAndStaff: parseInt(userCount.rows[0].count, 10),
                totalCctvCameras: parseInt(camCount.rows[0].count, 10),
                violationsByStatus: viosCount.rows,
                finesSummary: finesRes.rows,
            };
        }
        catch (err) {
            return { error: `Failed to fetch overview: ${err.message}` };
        }
    },
});
// ============================================================================
// CHAT ENDPOINTS
// ============================================================================
/**
 * GET /api/chat/status
 * Returns current Agent SDK status and loaded model
 */
router.get('/status', (req, res) => {
    res.json({
        status: 'healthy',
        sdk: 'OpenAI Agent SDK',
        model: AGENT_MODEL,
        provider: env_js_1.config.openai.baseUrl.includes('groq') ? 'Groq LPU' : 'OpenAI',
    });
});
/**
 * GET /api/chat/history
 * Returns the persistent chat history (latest 10 messages) and rolling summary
 */
router.get('/history', async (req, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(401).json({ error: 'User authentication required.' });
    }
    try {
        const query = 'SELECT chats, chat_summary, updated_at FROM ai_chats WHERE user_id = $1';
        const result = await index_js_1.pool.query(query, [userId]);
        if (result.rows.length === 0) {
            return res.json({ chats: [], chatSummary: null, updatedAt: null });
        }
        const row = result.rows[0];
        return res.json({
            chats: normalizeStoredChats(row.chats),
            chatSummary: row.chat_summary || null,
            updatedAt: row.updated_at,
        });
    }
    catch (err) {
        console.error('[Chat History Error]', err);
        return res.status(500).json({ error: 'Failed to fetch chat history.', detail: err.message });
    }
});
/**
 * DELETE /api/chat/history
 * Clears stored ai_chats record for the authenticated user
 */
router.delete('/history', async (req, res) => {
    const userId = resolveUserId(req, req.body?.userId);
    if (!userId) {
        return res.status(401).json({ error: 'User authentication required.' });
    }
    try {
        await index_js_1.pool.query('DELETE FROM ai_chats WHERE user_id = $1', [userId]);
        return res.json({ success: true, message: 'Chat history cleared successfully.' });
    }
    catch (err) {
        console.error('[Clear Chat History Error]', err);
        return res.status(500).json({ error: 'Failed to clear chat history.', detail: err.message });
    }
});
/**
 * POST /api/chat
 * Primary conversation endpoint using OpenAI Agent SDK with role-based permissions
 */
router.post('/', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'Message text is required.' });
        }
        const auth = extractAuthUser(req);
        const userId = resolveUserId(req, req.body?.userId);
        const userRole = (auth?.role || req.body?.role || 'CITIZEN').toUpperCase();
        // Fetch user details from database if available
        let userName = 'Citizen';
        let userPhone = '';
        let userEmail = '';
        if (userId) {
            const uRes = await index_js_1.pool.query('SELECT name, email, phone, role FROM users WHERE id = $1', [userId]);
            if (uRes.rows.length > 0) {
                userName = uRes.rows[0].name;
                userEmail = uRes.rows[0].email;
                userPhone = uRes.rows[0].phone || '';
            }
        }
        // 1. Load persisted ai_chats context for rolling memory
        let storedChats = [];
        let storedSummary = null;
        if (userId) {
            try {
                const cRes = await index_js_1.pool.query('SELECT chats, chat_summary FROM ai_chats WHERE user_id = $1', [userId]);
                if (cRes.rows.length > 0) {
                    storedChats = normalizeStoredChats(cRes.rows[0].chats);
                    storedSummary = cRes.rows[0].chat_summary || null;
                }
            }
            catch (cErr) {
                console.error('[ai_chats load error]', cErr.message);
            }
        }
        // 2. Pre-fetch role-specific context to ground the LLM
        let roleContextStr = '';
        let allowedTools = [];
        let roleTitle = 'Citizen Assistant';
        if (userRole === 'CITIZEN') {
            roleTitle = 'Navanagar Citizen Assistant';
            allowedTools = [getMyVehiclesTool, getMyViolationsTool];
            // Pre-fetch citizen vehicles and fines
            if (userId) {
                const myVehs = await index_js_1.pool.query('SELECT plate_number, vehicle_type FROM vehicles WHERE owner_id = $1', [userId]);
                const myVios = await index_js_1.pool.query(`SELECT v.id, v.type, f.amount, f.status AS fine_status 
           FROM violations v 
           JOIN vehicles veh ON veh.id = v.vehicle_id 
           LEFT JOIN fines f ON f.violation_id = v.id 
           WHERE veh.owner_id = $1 ORDER BY v.id DESC LIMIT 5`, [userId]);
                const vehList = myVehs.rows.map((v) => `${v.plate_number} (${v.vehicle_type})`).join(', ');
                const viosList = myVios.rows
                    .map((v) => `Violation #${v.id}: ${v.type} — Fine: ₹${v.amount || 0} (${v.fine_status || 'PENDING'})`)
                    .join('\n');
                roleContextStr = `
=== AUTHENTICATED CITIZEN PROFILE ===
- Citizen Name: ${userName}
- Phone: ${userPhone}
- Registered Vehicles: ${vehList || 'None registered'}
- Recent Violations & Fines:
${viosList || 'No violations on record.'}
`.trim();
            }
        }
        else if (userRole === 'POLICE') {
            roleTitle = 'Navanagar Police AI Console';
            allowedTools = [
                lookupVehicleTool,
                getCityViolationsSummaryTool,
                getCamerasStatusTool,
            ];
            const unpaidVios = await index_js_1.pool.query("SELECT count(*), COALESCE(SUM(amount), 0) AS total_due FROM fines WHERE status = 'UNPAID'");
            const camList = await index_js_1.pool.query('SELECT id, name, speed_limit FROM cameras LIMIT 5');
            roleContextStr = `
=== TRAFFIC POLICE ENFORCEMENT SUMMARY ===
- Officer on Duty: ${userName} (Navanagar Traffic Police)
- Active Outstanding Unpaid Fines: ${unpaidVios.rows[0].count} cases (Total Due: ₹${unpaidVios.rows[0].total_due})
- Key Monitored Cameras: ${camList.rows.map((c) => `${c.id} (${c.name}, ${c.speed_limit}km/h)`).join('; ')}
`.trim();
        }
        else if (userRole === 'ADMIN') {
            roleTitle = 'Navanagar Smart City Executive AI';
            allowedTools = [
                getSystemOverviewTool,
                lookupVehicleTool,
                getCityViolationsSummaryTool,
                getCamerasStatusTool,
            ];
            const totalV = await index_js_1.pool.query('SELECT count(*) FROM vehicles');
            const totalF = await index_js_1.pool.query("SELECT COALESCE(SUM(amount), 0) AS rev FROM fines WHERE status = 'PAID'");
            roleContextStr = `
=== CITY COMMAND CENTER INTELLIGENCE ===
- Administrator: ${userName}
- Total Fleet Registered: ${totalV.rows[0].count} vehicles
- Total Revenue Collected from Fines: ₹${totalF.rows[0].rev}
- Multi-Model Pipeline: Active on Port 8005 (Cloudflare R2 Video Persistence)
- Google Nano Banana Audit Engine: Active
`.trim();
        }
        // 3. Build System Instructions with Strict Role Permissions
        const memoryBlock = storedSummary
            ? `\n--- ROLLING CONVERSATION SUMMARY (from ai_chats) ---\n${storedSummary}\nUse this summary for continuity when the user refers to prior topics.\n`
            : '\n--- ROLLING CONVERSATION SUMMARY ---\nNo prior conversation summary yet.\n';
        const systemInstructions = `You are ${roleTitle}, an intelligent, highly responsive, and concise AI assistant for the Navanagar Smart Traffic & Mobility System.
Your objective is to provide clear, direct, and factual assistance tailored to the user's role (${userRole}).

STRICT ROLE PERMISSIONS RULE:
1. CITIZEN ROLE:
   - You only have permission to discuss the citizen's own vehicles, challans, fine payment status, and general traffic safety rules (helmet usage, speed limits, right-of-way).
   - NEVER disclose details about other citizens, other license plates, or internal police enforcement schedules.
   - If asked about someone else's plate or police data, politely decline: "As a citizen assistant, I can only provide information about your own registered vehicles and challans."

2. POLICE ROLE:
   - You have tactical enforcement permissions: vehicle license plate lookups, checking unpaid fines, viewing camera speed limits, and analyzing recent violation logs across city junctions.
   - Provide direct operational answers to help officers enforce traffic laws and verify challans.

3. ADMIN ROLE:
   - You have full city command-center access: system-wide vehicle registries, camera infrastructure, AI simulation metrics, fine revenue analytics, and Google Nano Banana verification audit stats.

CONCISENESS RULE:
- Deliver direct, to-the-point answers in 2 to 4 crisp sentences or tight bulleted lists.
- Avoid generic boilerplate or repetitive introductions.
${memoryBlock}
${roleContextStr}`;
        // 4. Initialize OpenAI Agent
        const agent = new agents_1.Agent({
            name: roleTitle,
            model: AGENT_MODEL,
            modelSettings: { maxTokens: 400 },
            instructions: systemInstructions,
            tools: allowedTools,
        });
        // 5. Format prompt with history context
        let fullPrompt = '';
        const storedHistory = storedChats.map((c) => ({
            role: c.created_by === 'ai' ? 'assistant' : 'user',
            content: truncateText(c.chat_text, 400),
        }));
        let effectiveHistory = [...storedHistory];
        if (Array.isArray(history) && history.length > 0) {
            const seen = new Set(storedHistory.map((m) => `${m.role}::${(m.content || '').trim()}`));
            for (const msg of history) {
                if (msg?.role && typeof msg.content === 'string' && msg.content.trim()) {
                    const trunc = truncateText(msg.content.trim(), 400);
                    const key = `${msg.role}::${trunc}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        effectiveHistory.push({ role: msg.role, content: trunc });
                    }
                }
            }
        }
        effectiveHistory = effectiveHistory.slice(-6);
        if (effectiveHistory.length > 0) {
            fullPrompt += 'Recent Conversation History:\n';
            for (const msg of effectiveHistory) {
                fullPrompt += `${String(msg.role).toUpperCase()}: ${msg.content}\n`;
            }
            fullPrompt += '\nCurrent User Question:\n';
        }
        fullPrompt += truncateText(message.trim(), 800);
        // 6. Execute OpenAI Agent
        let aiResponseText = '';
        try {
            const agentResult = await (0, agents_1.run)(agent, fullPrompt);
            aiResponseText = agentResult.finalOutput || 'I processed your request, but no response was returned.';
        }
        catch (runErr) {
            console.error('[OpenAI Agent Execution Error]', runErr.message);
            aiResponseText = `I apologize, but I encountered an issue accessing the traffic database: ${runErr.message}`;
        }
        // 7. Persist to ai_chats table (max 10 messages) & generate rolling summary
        let updatedChats = [];
        let chatSummary = storedSummary;
        if (userId) {
            try {
                const now = new Date().toISOString();
                const userEntry = { chat_text: message.trim(), created_at: now, created_by: 'user' };
                const aiEntry = { chat_text: aiResponseText, created_at: new Date().toISOString(), created_by: 'ai' };
                updatedChats = [...storedChats, userEntry, aiEntry].slice(-10);
                await index_js_1.pool.query(`INSERT INTO ai_chats (user_id, chats, chat_summary, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id) 
           DO UPDATE SET chats = EXCLUDED.chats, updated_at = NOW()`, [userId, JSON.stringify(updatedChats), chatSummary]);
                // Generate updated rolling summary via a lightweight agent
                try {
                    const summaryPrompt = 'Summarize the following traffic & smart city conversation in 2 concise sentences focusing on key topics and queries:\n\n' +
                        updatedChats.map((c) => `${c.created_by === 'user' ? 'User' : 'Assistant'}: ${c.chat_text}`).join('\n');
                    const summaryAgent = new agents_1.Agent({
                        name: 'Traffic Chat Summarizer',
                        model: AGENT_MODEL,
                        instructions: 'You are a concise summarizer. Reply ONLY with the 2-sentence summary — no preamble.',
                        tools: [],
                        modelSettings: { maxTokens: 150 },
                    });
                    const summaryResult = await (0, agents_1.run)(summaryAgent, summaryPrompt);
                    if (summaryResult?.finalOutput?.trim()) {
                        chatSummary = summaryResult.finalOutput.trim();
                        await index_js_1.pool.query('UPDATE ai_chats SET chat_summary = $1, updated_at = NOW() WHERE user_id = $2', [
                            chatSummary,
                            userId,
                        ]);
                    }
                }
                catch (sumErr) {
                    console.error('[ai_chats summary error]', sumErr.message);
                }
            }
            catch (persistErr) {
                console.error('[ai_chats persist error]', persistErr);
            }
        }
        return res.json({
            message: {
                role: 'assistant',
                content: aiResponseText,
            },
            agent: {
                name: agent.name,
                model: AGENT_MODEL,
                role: userRole,
                status: 'completed',
            },
            chats: updatedChats,
            chatSummary,
        });
    }
    catch (err) {
        console.error('[Chat Endpoint Error]', err);
        return res.status(500).json({
            error: 'Failed to process chat message.',
            detail: err.message,
        });
    }
});
exports.default = router;
