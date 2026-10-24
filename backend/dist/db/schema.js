"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRelations = exports.finesRelations = exports.evidenceRelations = exports.violationsRelations = exports.routeDistanceCacheRelations = exports.vehicleObservationsRelations = exports.detectionEventsRelations = exports.simulationTrafficLightsRelations = exports.videoFilesRelations = exports.simulationsRelations = exports.camerasRelations = exports.trafficLightsRelations = exports.vehiclesRelations = exports.aiChatsRelations = exports.usersRelations = exports.aiChats = exports.notifications = exports.fines = exports.evidence = exports.violations = exports.routeDistanceCache = exports.vehicleObservations = exports.detectionEvents = exports.simulationTrafficLights = exports.videoFiles = exports.simulations = exports.cameras = exports.trafficLights = exports.vehicles = exports.users = exports.notificationStatusEnum = exports.notificationChannelEnum = exports.fineStatusEnum = exports.evidenceTypeEnum = exports.violationStatusEnum = exports.violationTypeEnum = exports.detectionEventTypeEnum = exports.trafficLightStateEnum = exports.videoFileStatusEnum = exports.simulationStatusEnum = exports.cameraStatusEnum = exports.userStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// ============================================================================
// 1. ENUMS
// ============================================================================
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['CITIZEN', 'POLICE', 'ADMIN']);
exports.userStatusEnum = (0, pg_core_1.pgEnum)('user_status', ['ACTIVE', 'DISABLED']);
exports.cameraStatusEnum = (0, pg_core_1.pgEnum)('camera_status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE']);
exports.simulationStatusEnum = (0, pg_core_1.pgEnum)('simulation_status', [
    'READY',
    'RUNNING',
    'STOPPED',
    'COMPLETED',
    'FAILED',
]);
exports.videoFileStatusEnum = (0, pg_core_1.pgEnum)('video_file_status', [
    'PENDING',
    'UPLOADED',
    'PROCESSING',
    'PROCESSED',
    'FAILED',
]);
exports.trafficLightStateEnum = (0, pg_core_1.pgEnum)('traffic_light_state', ['RED', 'YELLOW', 'GREEN']);
exports.detectionEventTypeEnum = (0, pg_core_1.pgEnum)('detection_event_type', [
    'SPEED',
    'HELMET',
    'PLATE',
    'WRONG_SIDE',
]);
exports.violationTypeEnum = (0, pg_core_1.pgEnum)('violation_type', [
    'RED_LIGHT',
    'OVERSPEED',
    'WRONG_SIDE',
    'NO_HELMET',
]);
exports.violationStatusEnum = (0, pg_core_1.pgEnum)('violation_status', [
    'DETECTED',
    'PENDING_VERIFICATION',
    'VERIFIED',
    'REJECTED',
    'FINE_ISSUED',
]);
exports.evidenceTypeEnum = (0, pg_core_1.pgEnum)('evidence_type', ['FRAME', 'VIDEO_CLIP']);
exports.fineStatusEnum = (0, pg_core_1.pgEnum)('fine_status', ['UNPAID', 'PAID', 'CANCELLED']);
exports.notificationChannelEnum = (0, pg_core_1.pgEnum)('notification_channel', ['WHATSAPP', 'SMS', 'EMAIL']);
exports.notificationStatusEnum = (0, pg_core_1.pgEnum)('notification_status', ['PENDING', 'SENT', 'FAILED']);
// ============================================================================
// 2. TABLES
// ============================================================================
/**
 * 1. users
 * Stores all users of the system: citizens, police officers, and admins.
 */
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 50 }),
    role: (0, exports.userRoleEnum)('role').default('CITIZEN').notNull(),
    status: (0, exports.userStatusEnum)('status').default('ACTIVE').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.index)('idx_users_email').on(table.email),
    (0, pg_core_1.index)('idx_users_role').on(table.role),
]);
/**
 * 2. vehicles
 * Manually maintained vehicle registry.
 * Constraint: plate_number is unique.
 */
exports.vehicles = (0, pg_core_1.pgTable)('vehicles', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    plateNumber: (0, pg_core_1.varchar)('plate_number', { length: 50 }).notNull().unique(),
    ownerId: (0, pg_core_1.integer)('owner_id').references(() => exports.users.id, { onDelete: 'set null' }),
    vehicleType: (0, pg_core_1.varchar)('vehicle_type', { length: 50 }).notNull(), // CAR, MOTORCYCLE, BUS, TRUCK, etc.
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('idx_vehicles_plate_number').on(table.plateNumber),
    (0, pg_core_1.index)('idx_vehicles_owner_id').on(table.ownerId),
]);
/**
 * 4. traffic_lights
 * Stores permanent traffic-light infrastructure.
 * Does not store current_state, as states change per simulation timeline.
 */
exports.trafficLights = (0, pg_core_1.pgTable)('traffic_lights', {
    id: (0, pg_core_1.varchar)('id', { length: 50 }).primaryKey(), // e.g., 'TL-01'
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    latitude: (0, pg_core_1.doublePrecision)('latitude').notNull(),
    longitude: (0, pg_core_1.doublePrecision)('longitude').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
});
/**
 * 3. cameras
 * Stores permanent CCTV configuration.
 * Can be linked optionally to a traffic light.
 */
exports.cameras = (0, pg_core_1.pgTable)('cameras', {
    id: (0, pg_core_1.varchar)('id', { length: 50 }).primaryKey(), // e.g., 'CCTV-01'
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    latitude: (0, pg_core_1.doublePrecision)('latitude').notNull(),
    longitude: (0, pg_core_1.doublePrecision)('longitude').notNull(),
    speedLimit: (0, pg_core_1.integer)('speed_limit').notNull(),
    trafficLightId: (0, pg_core_1.varchar)('traffic_light_id', { length: 50 }).references(() => exports.trafficLights.id, {
        onDelete: 'set null',
    }),
    status: (0, exports.cameraStatusEnum)('status').default('ACTIVE').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.index)('idx_cameras_traffic_light_id').on(table.trafficLightId),
    (0, pg_core_1.index)('idx_cameras_status').on(table.status),
]);
/**
 * 5. simulations
 * Created every time the admin runs "START SIMULATION".
 */
exports.simulations = (0, pg_core_1.pgTable)('simulations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    status: (0, exports.simulationStatusEnum)('status').default('READY').notNull(),
    startedAt: (0, pg_core_1.timestamp)('started_at', { withTimezone: true }),
    endedAt: (0, pg_core_1.timestamp)('ended_at', { withTimezone: true }),
    createdBy: (0, pg_core_1.integer)('created_by').references(() => exports.users.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.index)('idx_simulations_status').on(table.status),
    (0, pg_core_1.index)('idx_simulations_created_by').on(table.createdBy),
]);
/**
 * 6. video_files
 * Stores metadata for CCTV videos uploaded for a particular simulation.
 * Video files are in Cloudflare R2, metadata in PostgreSQL.
 */
exports.videoFiles = (0, pg_core_1.pgTable)('video_files', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    cameraId: (0, pg_core_1.varchar)('camera_id', { length: 50 })
        .notNull()
        .references(() => exports.cameras.id, { onDelete: 'cascade' }),
    simulationId: (0, pg_core_1.integer)('simulation_id')
        .notNull()
        .references(() => exports.simulations.id, { onDelete: 'cascade' }),
    fileName: (0, pg_core_1.varchar)('file_name', { length: 255 }).notNull(),
    r2Key: (0, pg_core_1.text)('r2_key').notNull(),
    durationMs: (0, pg_core_1.integer)('duration_ms'),
    status: (0, exports.videoFileStatusEnum)('status').default('UPLOADED').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('idx_video_files_sim_cam').on(table.simulationId, table.cameraId),
    (0, pg_core_1.index)('idx_video_files_status').on(table.status),
]);
/**
 * 7. simulation_traffic_lights
 * Stores the initial state of each traffic light for a particular simulation (t = 0).
 */
exports.simulationTrafficLights = (0, pg_core_1.pgTable)('simulation_traffic_lights', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    simulationId: (0, pg_core_1.integer)('simulation_id')
        .notNull()
        .references(() => exports.simulations.id, { onDelete: 'cascade' }),
    trafficLightId: (0, pg_core_1.varchar)('traffic_light_id', { length: 50 })
        .notNull()
        .references(() => exports.trafficLights.id, { onDelete: 'cascade' }),
    initialState: (0, exports.trafficLightStateEnum)('initial_state').default('RED').notNull(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('idx_sim_tl_unique').on(table.simulationId, table.trafficLightId),
]);
/**
 * 8. detection_events
 * Meaningful ML detection events generated by FastAPI ML services.
 */
exports.detectionEvents = (0, pg_core_1.pgTable)('detection_events', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    simulationId: (0, pg_core_1.integer)('simulation_id')
        .notNull()
        .references(() => exports.simulations.id, { onDelete: 'cascade' }),
    cameraId: (0, pg_core_1.varchar)('camera_id', { length: 50 })
        .notNull()
        .references(() => exports.cameras.id, { onDelete: 'cascade' }),
    vehicleId: (0, pg_core_1.integer)('vehicle_id').references(() => exports.vehicles.id, { onDelete: 'set null' }),
    vehicleTrackId: (0, pg_core_1.varchar)('vehicle_track_id', { length: 100 }),
    plateNumber: (0, pg_core_1.varchar)('plate_number', { length: 50 }),
    eventType: (0, exports.detectionEventTypeEnum)('event_type').notNull(),
    simulationTimeMs: (0, pg_core_1.bigint)('simulation_time_ms', { mode: 'number' }).notNull(),
    confidence: (0, pg_core_1.doublePrecision)('confidence'),
    data: (0, pg_core_1.jsonb)('data'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('idx_detection_events_sim_cam').on(table.simulationId, table.cameraId),
    (0, pg_core_1.index)('idx_detection_events_plate').on(table.plateNumber),
    (0, pg_core_1.index)('idx_detection_events_type').on(table.eventType),
    (0, pg_core_1.index)('idx_detection_events_sim_time').on(table.simulationId, table.simulationTimeMs),
]);
/**
 * 10. vehicle_observations
 * Deduplicated & tracked vehicle observations for dynamic speed and movement calculations.
 */
exports.vehicleObservations = (0, pg_core_1.pgTable)('vehicle_observations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    simulationId: (0, pg_core_1.integer)('simulation_id')
        .notNull()
        .references(() => exports.simulations.id, { onDelete: 'cascade' }),
    cameraId: (0, pg_core_1.varchar)('camera_id', { length: 50 })
        .notNull()
        .references(() => exports.cameras.id, { onDelete: 'cascade' }),
    vehicleId: (0, pg_core_1.integer)('vehicle_id').references(() => exports.vehicles.id, { onDelete: 'set null' }),
    plateNumber: (0, pg_core_1.varchar)('plate_number', { length: 50 }),
    vehicleTrackId: (0, pg_core_1.varchar)('vehicle_track_id', { length: 100 }),
    simulationTimeMs: (0, pg_core_1.bigint)('simulation_time_ms', { mode: 'number' }).notNull(),
    latitude: (0, pg_core_1.doublePrecision)('latitude').notNull(),
    longitude: (0, pg_core_1.doublePrecision)('longitude').notNull(),
    confidence: (0, pg_core_1.doublePrecision)('confidence'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('idx_vehicle_obs_plate_time').on(table.plateNumber, table.simulationTimeMs),
    (0, pg_core_1.index)('idx_vehicle_obs_sim_time').on(table.simulationId, table.simulationTimeMs),
    (0, pg_core_1.index)('idx_vehicle_obs_camera').on(table.cameraId),
]);
/**
 * 11. route_distance_cache
 * Caches calculated route distances between pairs of CCTV locations from the routing service.
 */
exports.routeDistanceCache = (0, pg_core_1.pgTable)('route_distance_cache', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    cameraAId: (0, pg_core_1.varchar)('camera_a_id', { length: 50 })
        .notNull()
        .references(() => exports.cameras.id, { onDelete: 'cascade' }),
    cameraBId: (0, pg_core_1.varchar)('camera_b_id', { length: 50 })
        .notNull()
        .references(() => exports.cameras.id, { onDelete: 'cascade' }),
    distanceMeters: (0, pg_core_1.doublePrecision)('distance_meters').notNull(),
    provider: (0, pg_core_1.varchar)('provider', { length: 100 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('idx_route_distance_pair').on(table.cameraAId, table.cameraBId),
]);
/**
 * 13. violations
 * Stores actual confirmed/detected traffic violations.
 * vehicle_id is nullable if the license plate could not be identified.
 */
exports.violations = (0, pg_core_1.pgTable)('violations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    simulationId: (0, pg_core_1.integer)('simulation_id')
        .notNull()
        .references(() => exports.simulations.id, { onDelete: 'cascade' }),
    cameraId: (0, pg_core_1.varchar)('camera_id', { length: 50 })
        .notNull()
        .references(() => exports.cameras.id, { onDelete: 'cascade' }),
    vehicleId: (0, pg_core_1.integer)('vehicle_id').references(() => exports.vehicles.id, { onDelete: 'set null' }),
    type: (0, exports.violationTypeEnum)('type').notNull(),
    status: (0, exports.violationStatusEnum)('status').default('DETECTED').notNull(),
    simulationTimeMs: (0, pg_core_1.bigint)('simulation_time_ms', { mode: 'number' }).notNull(),
    confidence: (0, pg_core_1.doublePrecision)('confidence'),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('idx_violations_sim_type').on(table.simulationId, table.type),
    (0, pg_core_1.index)('idx_violations_status').on(table.status),
    (0, pg_core_1.index)('idx_violations_vehicle').on(table.vehicleId),
    (0, pg_core_1.index)('idx_violations_camera').on(table.cameraId),
    (0, pg_core_1.index)('idx_violations_sim_time').on(table.simulationId, table.simulationTimeMs),
]);
/**
 * 15. evidence
 * Stores evidence files (frames or video clips in Cloudflare R2) associated with a violation.
 */
exports.evidence = (0, pg_core_1.pgTable)('evidence', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    violationId: (0, pg_core_1.integer)('violation_id')
        .notNull()
        .references(() => exports.violations.id, { onDelete: 'cascade' }),
    type: (0, exports.evidenceTypeEnum)('type').notNull(),
    r2Key: (0, pg_core_1.text)('r2_key').notNull(),
    timestampMs: (0, pg_core_1.bigint)('timestamp_ms', { mode: 'number' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('idx_evidence_violation_id').on(table.violationId),
]);
/**
 * 16. fines
 * Stores fine records associated 1-to-1 with violations.
 */
exports.fines = (0, pg_core_1.pgTable)('fines', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    violationId: (0, pg_core_1.integer)('violation_id')
        .notNull()
        .unique()
        .references(() => exports.violations.id, { onDelete: 'cascade' }),
    amount: (0, pg_core_1.numeric)('amount', { precision: 10, scale: 2 }).notNull(),
    status: (0, exports.fineStatusEnum)('status').default('UNPAID').notNull(),
    pdfR2Key: (0, pg_core_1.text)('pdf_r2_key'),
    issuedAt: (0, pg_core_1.timestamp)('issued_at', { withTimezone: true }).defaultNow().notNull(),
    paidAt: (0, pg_core_1.timestamp)('paid_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.index)('idx_fines_status').on(table.status),
    (0, pg_core_1.index)('idx_fines_violation_id').on(table.violationId),
]);
/**
 * 18. notifications
 * Handles notification events (WhatsApp, SMS, Email).
 * Kept separate from fines to support retries and independent delivery states.
 */
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').references(() => exports.users.id, { onDelete: 'set null' }),
    vehicleId: (0, pg_core_1.integer)('vehicle_id').references(() => exports.vehicles.id, { onDelete: 'set null' }),
    violationId: (0, pg_core_1.integer)('violation_id').references(() => exports.violations.id, { onDelete: 'set null' }),
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(), // e.g. 'FINE_ISSUED'
    channel: (0, exports.notificationChannelEnum)('channel').default('WHATSAPP').notNull(),
    status: (0, exports.notificationStatusEnum)('status').default('PENDING').notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    r2Key: (0, pg_core_1.text)('r2_key'),
    sentAt: (0, pg_core_1.timestamp)('sent_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)('idx_notifications_user_id').on(table.userId),
    (0, pg_core_1.index)('idx_notifications_status').on(table.status),
    (0, pg_core_1.index)('idx_notifications_violation_id').on(table.violationId),
]);
/**
 * 15. ai_chats
 * Persistent chatbot conversation history and rolling summary for OpenAI Agent SDK.
 * Stores up to 10 recent messages per user in JSONB array.
 */
exports.aiChats = (0, pg_core_1.pgTable)('ai_chats', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    chats: (0, pg_core_1.jsonb)('chats').default([]).notNull(),
    chatSummary: (0, pg_core_1.text)('chat_summary'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('unq_user_ai_chat').on(table.userId),
    (0, pg_core_1.index)('idx_ai_chats_user_id').on(table.userId),
]);
// ============================================================================
// 3. RELATIONS
// ============================================================================
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many, one }) => ({
    vehicles: many(exports.vehicles),
    simulations: many(exports.simulations),
    notifications: many(exports.notifications),
    aiChat: one(exports.aiChats, {
        fields: [exports.users.id],
        references: [exports.aiChats.userId],
    }),
}));
exports.aiChatsRelations = (0, drizzle_orm_1.relations)(exports.aiChats, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.aiChats.userId],
        references: [exports.users.id],
    }),
}));
exports.vehiclesRelations = (0, drizzle_orm_1.relations)(exports.vehicles, ({ one, many }) => ({
    owner: one(exports.users, {
        fields: [exports.vehicles.ownerId],
        references: [exports.users.id],
    }),
    violations: many(exports.violations),
    detectionEvents: many(exports.detectionEvents),
    vehicleObservations: many(exports.vehicleObservations),
    notifications: many(exports.notifications),
}));
exports.trafficLightsRelations = (0, drizzle_orm_1.relations)(exports.trafficLights, ({ many }) => ({
    cameras: many(exports.cameras),
    simulationTrafficLights: many(exports.simulationTrafficLights),
}));
exports.camerasRelations = (0, drizzle_orm_1.relations)(exports.cameras, ({ one, many }) => ({
    trafficLight: one(exports.trafficLights, {
        fields: [exports.cameras.trafficLightId],
        references: [exports.trafficLights.id],
    }),
    videoFiles: many(exports.videoFiles),
    detectionEvents: many(exports.detectionEvents),
    vehicleObservations: many(exports.vehicleObservations),
    violations: many(exports.violations),
    routesAsCameraA: many(exports.routeDistanceCache, { relationName: 'cameraA' }),
    routesAsCameraB: many(exports.routeDistanceCache, { relationName: 'cameraB' }),
}));
exports.simulationsRelations = (0, drizzle_orm_1.relations)(exports.simulations, ({ one, many }) => ({
    creator: one(exports.users, {
        fields: [exports.simulations.createdBy],
        references: [exports.users.id],
    }),
    videoFiles: many(exports.videoFiles),
    simulationTrafficLights: many(exports.simulationTrafficLights),
    detectionEvents: many(exports.detectionEvents),
    vehicleObservations: many(exports.vehicleObservations),
    violations: many(exports.violations),
}));
exports.videoFilesRelations = (0, drizzle_orm_1.relations)(exports.videoFiles, ({ one }) => ({
    camera: one(exports.cameras, {
        fields: [exports.videoFiles.cameraId],
        references: [exports.cameras.id],
    }),
    simulation: one(exports.simulations, {
        fields: [exports.videoFiles.simulationId],
        references: [exports.simulations.id],
    }),
}));
exports.simulationTrafficLightsRelations = (0, drizzle_orm_1.relations)(exports.simulationTrafficLights, ({ one }) => ({
    simulation: one(exports.simulations, {
        fields: [exports.simulationTrafficLights.simulationId],
        references: [exports.simulations.id],
    }),
    trafficLight: one(exports.trafficLights, {
        fields: [exports.simulationTrafficLights.trafficLightId],
        references: [exports.trafficLights.id],
    }),
}));
exports.detectionEventsRelations = (0, drizzle_orm_1.relations)(exports.detectionEvents, ({ one }) => ({
    simulation: one(exports.simulations, {
        fields: [exports.detectionEvents.simulationId],
        references: [exports.simulations.id],
    }),
    camera: one(exports.cameras, {
        fields: [exports.detectionEvents.cameraId],
        references: [exports.cameras.id],
    }),
    vehicle: one(exports.vehicles, {
        fields: [exports.detectionEvents.vehicleId],
        references: [exports.vehicles.id],
    }),
}));
exports.vehicleObservationsRelations = (0, drizzle_orm_1.relations)(exports.vehicleObservations, ({ one }) => ({
    simulation: one(exports.simulations, {
        fields: [exports.vehicleObservations.simulationId],
        references: [exports.simulations.id],
    }),
    camera: one(exports.cameras, {
        fields: [exports.vehicleObservations.cameraId],
        references: [exports.cameras.id],
    }),
    vehicle: one(exports.vehicles, {
        fields: [exports.vehicleObservations.vehicleId],
        references: [exports.vehicles.id],
    }),
}));
exports.routeDistanceCacheRelations = (0, drizzle_orm_1.relations)(exports.routeDistanceCache, ({ one }) => ({
    cameraA: one(exports.cameras, {
        fields: [exports.routeDistanceCache.cameraAId],
        references: [exports.cameras.id],
        relationName: 'cameraA',
    }),
    cameraB: one(exports.cameras, {
        fields: [exports.routeDistanceCache.cameraBId],
        references: [exports.cameras.id],
        relationName: 'cameraB',
    }),
}));
exports.violationsRelations = (0, drizzle_orm_1.relations)(exports.violations, ({ one, many }) => ({
    simulation: one(exports.simulations, {
        fields: [exports.violations.simulationId],
        references: [exports.simulations.id],
    }),
    camera: one(exports.cameras, {
        fields: [exports.violations.cameraId],
        references: [exports.cameras.id],
    }),
    vehicle: one(exports.vehicles, {
        fields: [exports.violations.vehicleId],
        references: [exports.vehicles.id],
    }),
    evidence: many(exports.evidence),
    fine: one(exports.fines, {
        fields: [exports.violations.id],
        references: [exports.fines.violationId],
    }),
    notifications: many(exports.notifications),
}));
exports.evidenceRelations = (0, drizzle_orm_1.relations)(exports.evidence, ({ one }) => ({
    violation: one(exports.violations, {
        fields: [exports.evidence.violationId],
        references: [exports.violations.id],
    }),
}));
exports.finesRelations = (0, drizzle_orm_1.relations)(exports.fines, ({ one }) => ({
    violation: one(exports.violations, {
        fields: [exports.fines.violationId],
        references: [exports.violations.id],
    }),
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.notifications.userId],
        references: [exports.users.id],
    }),
    vehicle: one(exports.vehicles, {
        fields: [exports.notifications.vehicleId],
        references: [exports.vehicles.id],
    }),
    violation: one(exports.violations, {
        fields: [exports.notifications.violationId],
        references: [exports.violations.id],
    }),
}));
