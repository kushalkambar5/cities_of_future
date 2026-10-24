CREATE TYPE "public"."camera_status" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."detection_event_type" AS ENUM('SPEED', 'HELMET', 'PLATE', 'WRONG_SIDE');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('FRAME', 'VIDEO_CLIP');--> statement-breakpoint
CREATE TYPE "public"."fine_status" AS ENUM('UNPAID', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('WHATSAPP', 'SMS', 'EMAIL');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."simulation_status" AS ENUM('READY', 'RUNNING', 'STOPPED', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."traffic_light_state" AS ENUM('RED', 'YELLOW', 'GREEN');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CITIZEN', 'POLICE', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."video_file_status" AS ENUM('PENDING', 'UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."violation_status" AS ENUM('DETECTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'FINE_ISSUED');--> statement-breakpoint
CREATE TYPE "public"."violation_type" AS ENUM('RED_LIGHT', 'OVERSPEED', 'WRONG_SIDE', 'NO_HELMET');--> statement-breakpoint
CREATE TABLE "cameras" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"speed_limit" integer NOT NULL,
	"traffic_light_id" varchar(50),
	"status" "camera_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detection_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"simulation_id" integer NOT NULL,
	"camera_id" varchar(50) NOT NULL,
	"vehicle_id" integer,
	"vehicle_track_id" varchar(100),
	"plate_number" varchar(50),
	"event_type" "detection_event_type" NOT NULL,
	"simulation_time_ms" bigint NOT NULL,
	"confidence" double precision,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"violation_id" integer NOT NULL,
	"type" "evidence_type" NOT NULL,
	"r2_key" text NOT NULL,
	"timestamp_ms" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" serial PRIMARY KEY NOT NULL,
	"violation_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "fine_status" DEFAULT 'UNPAID' NOT NULL,
	"pdf_r2_key" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fines_violation_id_unique" UNIQUE("violation_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"vehicle_id" integer,
	"violation_id" integer,
	"type" varchar(50) NOT NULL,
	"channel" "notification_channel" DEFAULT 'WHATSAPP' NOT NULL,
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"message" text NOT NULL,
	"r2_key" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_distance_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_a_id" varchar(50) NOT NULL,
	"camera_b_id" varchar(50) NOT NULL,
	"distance_meters" double precision NOT NULL,
	"provider" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_traffic_lights" (
	"id" serial PRIMARY KEY NOT NULL,
	"simulation_id" integer NOT NULL,
	"traffic_light_id" varchar(50) NOT NULL,
	"initial_state" "traffic_light_state" DEFAULT 'RED' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "simulation_status" DEFAULT 'READY' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traffic_lights" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"phone" varchar(50),
	"role" "user_role" DEFAULT 'CITIZEN' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"simulation_id" integer NOT NULL,
	"camera_id" varchar(50) NOT NULL,
	"vehicle_id" integer,
	"plate_number" varchar(50),
	"vehicle_track_id" varchar(100),
	"simulation_time_ms" bigint NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"confidence" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate_number" varchar(50) NOT NULL,
	"owner_id" integer,
	"vehicle_type" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
CREATE TABLE "video_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(50) NOT NULL,
	"simulation_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"r2_key" text NOT NULL,
	"duration_ms" integer,
	"status" "video_file_status" DEFAULT 'UPLOADED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"simulation_id" integer NOT NULL,
	"camera_id" varchar(50) NOT NULL,
	"vehicle_id" integer,
	"type" "violation_type" NOT NULL,
	"status" "violation_status" DEFAULT 'DETECTED' NOT NULL,
	"simulation_time_ms" bigint NOT NULL,
	"confidence" double precision,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_traffic_light_id_traffic_lights_id_fk" FOREIGN KEY ("traffic_light_id") REFERENCES "public"."traffic_lights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_violation_id_violations_id_fk" FOREIGN KEY ("violation_id") REFERENCES "public"."violations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_violation_id_violations_id_fk" FOREIGN KEY ("violation_id") REFERENCES "public"."violations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_violation_id_violations_id_fk" FOREIGN KEY ("violation_id") REFERENCES "public"."violations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_distance_cache" ADD CONSTRAINT "route_distance_cache_camera_a_id_cameras_id_fk" FOREIGN KEY ("camera_a_id") REFERENCES "public"."cameras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_distance_cache" ADD CONSTRAINT "route_distance_cache_camera_b_id_cameras_id_fk" FOREIGN KEY ("camera_b_id") REFERENCES "public"."cameras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_traffic_lights" ADD CONSTRAINT "simulation_traffic_lights_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_traffic_lights" ADD CONSTRAINT "simulation_traffic_lights_traffic_light_id_traffic_lights_id_fk" FOREIGN KEY ("traffic_light_id") REFERENCES "public"."traffic_lights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_observations" ADD CONSTRAINT "vehicle_observations_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_observations" ADD CONSTRAINT "vehicle_observations_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_observations" ADD CONSTRAINT "vehicle_observations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_files" ADD CONSTRAINT "video_files_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_files" ADD CONSTRAINT "video_files_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cameras_traffic_light_id" ON "cameras" USING btree ("traffic_light_id");--> statement-breakpoint
CREATE INDEX "idx_cameras_status" ON "cameras" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_detection_events_sim_cam" ON "detection_events" USING btree ("simulation_id","camera_id");--> statement-breakpoint
CREATE INDEX "idx_detection_events_plate" ON "detection_events" USING btree ("plate_number");--> statement-breakpoint
CREATE INDEX "idx_detection_events_type" ON "detection_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_detection_events_sim_time" ON "detection_events" USING btree ("simulation_id","simulation_time_ms");--> statement-breakpoint
CREATE INDEX "idx_evidence_violation_id" ON "evidence" USING btree ("violation_id");--> statement-breakpoint
CREATE INDEX "idx_fines_status" ON "fines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fines_violation_id" ON "fines" USING btree ("violation_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notifications_violation_id" ON "notifications" USING btree ("violation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_route_distance_pair" ON "route_distance_cache" USING btree ("camera_a_id","camera_b_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sim_tl_unique" ON "simulation_traffic_lights" USING btree ("simulation_id","traffic_light_id");--> statement-breakpoint
CREATE INDEX "idx_simulations_status" ON "simulations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_simulations_created_by" ON "simulations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_vehicle_obs_plate_time" ON "vehicle_observations" USING btree ("plate_number","simulation_time_ms");--> statement-breakpoint
CREATE INDEX "idx_vehicle_obs_sim_time" ON "vehicle_observations" USING btree ("simulation_id","simulation_time_ms");--> statement-breakpoint
CREATE INDEX "idx_vehicle_obs_camera" ON "vehicle_observations" USING btree ("camera_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vehicles_plate_number" ON "vehicles" USING btree ("plate_number");--> statement-breakpoint
CREATE INDEX "idx_vehicles_owner_id" ON "vehicles" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_video_files_sim_cam" ON "video_files" USING btree ("simulation_id","camera_id");--> statement-breakpoint
CREATE INDEX "idx_video_files_status" ON "video_files" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_violations_sim_type" ON "violations" USING btree ("simulation_id","type");--> statement-breakpoint
CREATE INDEX "idx_violations_status" ON "violations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_violations_vehicle" ON "violations" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_violations_camera" ON "violations" USING btree ("camera_id");--> statement-breakpoint
CREATE INDEX "idx_violations_sim_time" ON "violations" USING btree ("simulation_id","simulation_time_ms");