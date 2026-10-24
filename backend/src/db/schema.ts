import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  bigint,
  doublePrecision,
  numeric,
  timestamp,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// 1. ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['CITIZEN', 'POLICE', 'ADMIN']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'DISABLED']);

export const cameraStatusEnum = pgEnum('camera_status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE']);

export const simulationStatusEnum = pgEnum('simulation_status', [
  'READY',
  'RUNNING',
  'STOPPED',
  'COMPLETED',
  'FAILED',
]);

export const videoFileStatusEnum = pgEnum('video_file_status', [
  'PENDING',
  'UPLOADED',
  'PROCESSING',
  'PROCESSED',
  'FAILED',
]);

export const trafficLightStateEnum = pgEnum('traffic_light_state', ['RED', 'YELLOW', 'GREEN']);

export const detectionEventTypeEnum = pgEnum('detection_event_type', [
  'SPEED',
  'HELMET',
  'PLATE',
  'WRONG_SIDE',
]);

export const violationTypeEnum = pgEnum('violation_type', [
  'RED_LIGHT',
  'OVERSPEED',
  'WRONG_SIDE',
  'NO_HELMET',
]);

export const violationStatusEnum = pgEnum('violation_status', [
  'DETECTED',
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'FINE_ISSUED',
]);

export const evidenceTypeEnum = pgEnum('evidence_type', ['FRAME', 'VIDEO_CLIP']);

export const fineStatusEnum = pgEnum('fine_status', ['UNPAID', 'PAID', 'CANCELLED']);

export const notificationChannelEnum = pgEnum('notification_channel', ['WHATSAPP', 'SMS', 'EMAIL']);
export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED']);

// ============================================================================
// 2. TABLES
// ============================================================================

/**
 * 1. users
 * Stores all users of the system: citizens, police officers, and admins.
 */
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    role: userRoleEnum('role').default('CITIZEN').notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_users_email').on(table.email),
    index('idx_users_role').on(table.role),
  ]
);

/**
 * 2. vehicles
 * Manually maintained vehicle registry.
 * Constraint: plate_number is unique.
 */
export const vehicles = pgTable(
  'vehicles',
  {
    id: serial('id').primaryKey(),
    plateNumber: varchar('plate_number', { length: 50 }).notNull().unique(),
    ownerId: integer('owner_id').references(() => users.id, { onDelete: 'set null' }),
    vehicleType: varchar('vehicle_type', { length: 50 }).notNull(), // CAR, MOTORCYCLE, BUS, TRUCK, etc.
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('idx_vehicles_plate_number').on(table.plateNumber),
    index('idx_vehicles_owner_id').on(table.ownerId),
  ]
);

/**
 * 4. traffic_lights
 * Stores permanent traffic-light infrastructure.
 * Does not store current_state, as states change per simulation timeline.
 */
export const trafficLights = pgTable(
  'traffic_lights',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // e.g., 'TL-01'
    name: varchar('name', { length: 255 }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }
);

/**
 * 3. cameras
 * Stores permanent CCTV configuration.
 * Can be linked optionally to a traffic light.
 */
export const cameras = pgTable(
  'cameras',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // e.g., 'CCTV-01'
    name: varchar('name', { length: 255 }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    speedLimit: integer('speed_limit').notNull(),
    trafficLightId: varchar('traffic_light_id', { length: 50 }).references(() => trafficLights.id, {
      onDelete: 'set null',
    }),
    status: cameraStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_cameras_traffic_light_id').on(table.trafficLightId),
    index('idx_cameras_status').on(table.status),
  ]
);

/**
 * 5. simulations
 * Created every time the admin runs "START SIMULATION".
 */
export const simulations = pgTable(
  'simulations',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    status: simulationStatusEnum('status').default('READY').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_simulations_status').on(table.status),
    index('idx_simulations_created_by').on(table.createdBy),
  ]
);

/**
 * 6. video_files
 * Stores metadata for CCTV videos uploaded for a particular simulation.
 * Video files are in Cloudflare R2, metadata in PostgreSQL.
 */
export const videoFiles = pgTable(
  'video_files',
  {
    id: serial('id').primaryKey(),
    cameraId: varchar('camera_id', { length: 50 })
      .notNull()
      .references(() => cameras.id, { onDelete: 'cascade' }),
    simulationId: integer('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    r2Key: text('r2_key').notNull(),
    durationMs: integer('duration_ms'),
    status: videoFileStatusEnum('status').default('UPLOADED').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_video_files_sim_cam').on(table.simulationId, table.cameraId),
    index('idx_video_files_status').on(table.status),
  ]
);

/**
 * 7. simulation_traffic_lights
 * Stores the initial state of each traffic light for a particular simulation (t = 0).
 */
export const simulationTrafficLights = pgTable(
  'simulation_traffic_lights',
  {
    id: serial('id').primaryKey(),
    simulationId: integer('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    trafficLightId: varchar('traffic_light_id', { length: 50 })
      .notNull()
      .references(() => trafficLights.id, { onDelete: 'cascade' }),
    initialState: trafficLightStateEnum('initial_state').default('RED').notNull(),
  },
  (table) => [
    uniqueIndex('idx_sim_tl_unique').on(table.simulationId, table.trafficLightId),
  ]
);

/**
 * 8. detection_events
 * Meaningful ML detection events generated by FastAPI ML services.
 */
export const detectionEvents = pgTable(
  'detection_events',
  {
    id: serial('id').primaryKey(),
    simulationId: integer('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    cameraId: varchar('camera_id', { length: 50 })
      .notNull()
      .references(() => cameras.id, { onDelete: 'cascade' }),
    vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    vehicleTrackId: varchar('vehicle_track_id', { length: 100 }),
    plateNumber: varchar('plate_number', { length: 50 }),
    eventType: detectionEventTypeEnum('event_type').notNull(),
    simulationTimeMs: bigint('simulation_time_ms', { mode: 'number' }).notNull(),
    confidence: doublePrecision('confidence'),
    data: jsonb('data'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_detection_events_sim_cam').on(table.simulationId, table.cameraId),
    index('idx_detection_events_plate').on(table.plateNumber),
    index('idx_detection_events_type').on(table.eventType),
    index('idx_detection_events_sim_time').on(table.simulationId, table.simulationTimeMs),
  ]
);

/**
 * 10. vehicle_observations
 * Deduplicated & tracked vehicle observations for dynamic speed and movement calculations.
 */
export const vehicleObservations = pgTable(
  'vehicle_observations',
  {
    id: serial('id').primaryKey(),
    simulationId: integer('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    cameraId: varchar('camera_id', { length: 50 })
      .notNull()
      .references(() => cameras.id, { onDelete: 'cascade' }),
    vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    plateNumber: varchar('plate_number', { length: 50 }),
    vehicleTrackId: varchar('vehicle_track_id', { length: 100 }),
    simulationTimeMs: bigint('simulation_time_ms', { mode: 'number' }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    confidence: doublePrecision('confidence'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_vehicle_obs_plate_time').on(table.plateNumber, table.simulationTimeMs),
    index('idx_vehicle_obs_sim_time').on(table.simulationId, table.simulationTimeMs),
    index('idx_vehicle_obs_camera').on(table.cameraId),
  ]
);

/**
 * 11. route_distance_cache
 * Caches calculated route distances between pairs of CCTV locations from the routing service.
 */
export const routeDistanceCache = pgTable(
  'route_distance_cache',
  {
    id: serial('id').primaryKey(),
    cameraAId: varchar('camera_a_id', { length: 50 })
      .notNull()
      .references(() => cameras.id, { onDelete: 'cascade' }),
    cameraBId: varchar('camera_b_id', { length: 50 })
      .notNull()
      .references(() => cameras.id, { onDelete: 'cascade' }),
    distanceMeters: doublePrecision('distance_meters').notNull(),
    provider: varchar('provider', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('idx_route_distance_pair').on(table.cameraAId, table.cameraBId),
  ]
);

/**
 * 13. violations
 * Stores actual confirmed/detected traffic violations.
 * vehicle_id is nullable if the license plate could not be identified.
 */
export const violations = pgTable(
  'violations',
  {
    id: serial('id').primaryKey(),
    simulationId: integer('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    cameraId: varchar('camera_id', { length: 50 })
      .notNull()
      .references(() => cameras.id, { onDelete: 'cascade' }),
    vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    type: violationTypeEnum('type').notNull(),
    status: violationStatusEnum('status').default('DETECTED').notNull(),
    simulationTimeMs: bigint('simulation_time_ms', { mode: 'number' }).notNull(),
    confidence: doublePrecision('confidence'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_violations_sim_type').on(table.simulationId, table.type),
    index('idx_violations_status').on(table.status),
    index('idx_violations_vehicle').on(table.vehicleId),
    index('idx_violations_camera').on(table.cameraId),
    index('idx_violations_sim_time').on(table.simulationId, table.simulationTimeMs),
  ]
);

/**
 * 15. evidence
 * Stores evidence files (frames or video clips in Cloudflare R2) associated with a violation.
 */
export const evidence = pgTable(
  'evidence',
  {
    id: serial('id').primaryKey(),
    violationId: integer('violation_id')
      .notNull()
      .references(() => violations.id, { onDelete: 'cascade' }),
    type: evidenceTypeEnum('type').notNull(),
    r2Key: text('r2_key').notNull(),
    timestampMs: bigint('timestamp_ms', { mode: 'number' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_evidence_violation_id').on(table.violationId),
  ]
);

/**
 * 16. fines
 * Stores fine records associated 1-to-1 with violations.
 */
export const fines = pgTable(
  'fines',
  {
    id: serial('id').primaryKey(),
    violationId: integer('violation_id')
      .notNull()
      .unique()
      .references(() => violations.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    status: fineStatusEnum('status').default('UNPAID').notNull(),
    pdfR2Key: text('pdf_r2_key'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_fines_status').on(table.status),
    index('idx_fines_violation_id').on(table.violationId),
  ]
);

/**
 * 18. notifications
 * Handles notification events (WhatsApp, SMS, Email).
 * Kept separate from fines to support retries and independent delivery states.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    violationId: integer('violation_id').references(() => violations.id, { onDelete: 'set null' }),
    type: varchar('type', { length: 50 }).notNull(), // e.g. 'FINE_ISSUED'
    channel: notificationChannelEnum('channel').default('WHATSAPP').notNull(),
    status: notificationStatusEnum('status').default('PENDING').notNull(),
    message: text('message').notNull(),
    r2Key: text('r2_key'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notifications_user_id').on(table.userId),
    index('idx_notifications_status').on(table.status),
    index('idx_notifications_violation_id').on(table.violationId),
  ]
);

/**
 * 15. ai_chats
 * Persistent chatbot conversation history and rolling summary for OpenAI Agent SDK.
 * Stores up to 10 recent messages per user in JSONB array.
 */
export const aiChats = pgTable(
  'ai_chats',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chats: jsonb('chats').default([]).notNull(),
    chatSummary: text('chat_summary'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('unq_user_ai_chat').on(table.userId),
    index('idx_ai_chats_user_id').on(table.userId),
  ]
);

// ============================================================================
// 3. RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  vehicles: many(vehicles),
  simulations: many(simulations),
  notifications: many(notifications),
  aiChat: one(aiChats, {
    fields: [users.id],
    references: [aiChats.userId],
  }),
}));

export const aiChatsRelations = relations(aiChats, ({ one }) => ({
  user: one(users, {
    fields: [aiChats.userId],
    references: [users.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  owner: one(users, {
    fields: [vehicles.ownerId],
    references: [users.id],
  }),
  violations: many(violations),
  detectionEvents: many(detectionEvents),
  vehicleObservations: many(vehicleObservations),
  notifications: many(notifications),
}));

export const trafficLightsRelations = relations(trafficLights, ({ many }) => ({
  cameras: many(cameras),
  simulationTrafficLights: many(simulationTrafficLights),
}));

export const camerasRelations = relations(cameras, ({ one, many }) => ({
  trafficLight: one(trafficLights, {
    fields: [cameras.trafficLightId],
    references: [trafficLights.id],
  }),
  videoFiles: many(videoFiles),
  detectionEvents: many(detectionEvents),
  vehicleObservations: many(vehicleObservations),
  violations: many(violations),
  routesAsCameraA: many(routeDistanceCache, { relationName: 'cameraA' }),
  routesAsCameraB: many(routeDistanceCache, { relationName: 'cameraB' }),
}));

export const simulationsRelations = relations(simulations, ({ one, many }) => ({
  creator: one(users, {
    fields: [simulations.createdBy],
    references: [users.id],
  }),
  videoFiles: many(videoFiles),
  simulationTrafficLights: many(simulationTrafficLights),
  detectionEvents: many(detectionEvents),
  vehicleObservations: many(vehicleObservations),
  violations: many(violations),
}));

export const videoFilesRelations = relations(videoFiles, ({ one }) => ({
  camera: one(cameras, {
    fields: [videoFiles.cameraId],
    references: [cameras.id],
  }),
  simulation: one(simulations, {
    fields: [videoFiles.simulationId],
    references: [simulations.id],
  }),
}));

export const simulationTrafficLightsRelations = relations(simulationTrafficLights, ({ one }) => ({
  simulation: one(simulations, {
    fields: [simulationTrafficLights.simulationId],
    references: [simulations.id],
  }),
  trafficLight: one(trafficLights, {
    fields: [simulationTrafficLights.trafficLightId],
    references: [trafficLights.id],
  }),
}));

export const detectionEventsRelations = relations(detectionEvents, ({ one }) => ({
  simulation: one(simulations, {
    fields: [detectionEvents.simulationId],
    references: [simulations.id],
  }),
  camera: one(cameras, {
    fields: [detectionEvents.cameraId],
    references: [cameras.id],
  }),
  vehicle: one(vehicles, {
    fields: [detectionEvents.vehicleId],
    references: [vehicles.id],
  }),
}));

export const vehicleObservationsRelations = relations(vehicleObservations, ({ one }) => ({
  simulation: one(simulations, {
    fields: [vehicleObservations.simulationId],
    references: [simulations.id],
  }),
  camera: one(cameras, {
    fields: [vehicleObservations.cameraId],
    references: [cameras.id],
  }),
  vehicle: one(vehicles, {
    fields: [vehicleObservations.vehicleId],
    references: [vehicles.id],
  }),
}));

export const routeDistanceCacheRelations = relations(routeDistanceCache, ({ one }) => ({
  cameraA: one(cameras, {
    fields: [routeDistanceCache.cameraAId],
    references: [cameras.id],
    relationName: 'cameraA',
  }),
  cameraB: one(cameras, {
    fields: [routeDistanceCache.cameraBId],
    references: [cameras.id],
    relationName: 'cameraB',
  }),
}));

export const violationsRelations = relations(violations, ({ one, many }) => ({
  simulation: one(simulations, {
    fields: [violations.simulationId],
    references: [simulations.id],
  }),
  camera: one(cameras, {
    fields: [violations.cameraId],
    references: [cameras.id],
  }),
  vehicle: one(vehicles, {
    fields: [violations.vehicleId],
    references: [vehicles.id],
  }),
  evidence: many(evidence),
  fine: one(fines, {
    fields: [violations.id],
    references: [fines.violationId],
  }),
  notifications: many(notifications),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  violation: one(violations, {
    fields: [evidence.violationId],
    references: [violations.id],
  }),
}));

export const finesRelations = relations(fines, ({ one }) => ({
  violation: one(violations, {
    fields: [fines.violationId],
    references: [violations.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [notifications.vehicleId],
    references: [vehicles.id],
  }),
  violation: one(violations, {
    fields: [notifications.violationId],
    references: [violations.id],
  }),
}));

// ============================================================================
// 4. INFERRED TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export type Camera = typeof cameras.$inferSelect;
export type NewCamera = typeof cameras.$inferInsert;

export type TrafficLight = typeof trafficLights.$inferSelect;
export type NewTrafficLight = typeof trafficLights.$inferInsert;

export type Simulation = typeof simulations.$inferSelect;
export type NewSimulation = typeof simulations.$inferInsert;

export type VideoFile = typeof videoFiles.$inferSelect;
export type NewVideoFile = typeof videoFiles.$inferInsert;

export type SimulationTrafficLight = typeof simulationTrafficLights.$inferSelect;
export type NewSimulationTrafficLight = typeof simulationTrafficLights.$inferInsert;

export type DetectionEvent = typeof detectionEvents.$inferSelect;
export type NewDetectionEvent = typeof detectionEvents.$inferInsert;

export type VehicleObservation = typeof vehicleObservations.$inferSelect;
export type NewVehicleObservation = typeof vehicleObservations.$inferInsert;

export type RouteDistanceCache = typeof routeDistanceCache.$inferSelect;
export type NewRouteDistanceCache = typeof routeDistanceCache.$inferInsert;

export type Violation = typeof violations.$inferSelect;
export type NewViolation = typeof violations.$inferInsert;

export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;

export type Fine = typeof fines.$inferSelect;
export type NewFine = typeof fines.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type AiChat = typeof aiChats.$inferSelect;
export type NewAiChat = typeof aiChats.$inferInsert;
