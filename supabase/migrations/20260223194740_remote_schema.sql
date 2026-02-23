


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_max_leaders"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.role = 'leader' THEN
    IF (SELECT COUNT(*) FROM club_memberships
        WHERE club_id = NEW.club_id AND role = 'leader' AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) >= 2 THEN
      RAISE EXCEPTION 'Maximum of 2 leaders per club allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_max_leaders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_club_id"() RETURNS character
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_id CHAR(4);
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM clubs WHERE club_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."generate_club_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "action_type" character varying NOT NULL,
    "target_type" character varying NOT NULL,
    "target_id" "uuid",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."authorized_photographers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "name" "text",
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."authorized_photographers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_manual_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "section_name" "text",
    "role" "text"
);


ALTER TABLE "public"."club_manual_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "club_memberships_role_check" CHECK (("role" = ANY (ARRAY['member'::"text", 'leader'::"text"])))
);


ALTER TABLE "public"."club_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "candid_image_1" "text",
    "candid_image_2" "text",
    "candid_image_3" "text",
    "approval_status" character varying(50) DEFAULT 'pending'::character varying,
    "approval_notes" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "document_links" "text",
    "document_notes" "text",
    CONSTRAINT "clubs_approval_status_check" CHECK ((("approval_status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying])::"text"[])))
);


ALTER TABLE "public"."clubs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clubs"."document_links" IS 'Important links stored by club leaders (max 2000 chars)';



COMMENT ON COLUMN "public"."clubs"."document_notes" IS 'Private notes for club leaders (max 5000 chars)';



CREATE TABLE IF NOT EXISTS "public"."community_candids" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "event_name" "text",
    "event_type" "text",
    "image_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "event_description" "text"
);


ALTER TABLE "public"."community_candids" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_name" character varying(100) NOT NULL,
    "is_frozen" boolean DEFAULT false,
    "frozen_by" "uuid",
    "frozen_at" timestamp with time zone,
    "unfrozen_by" "uuid",
    "unfrozen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "config_value" "jsonb" DEFAULT '{}'::"jsonb",
    "closes_at" timestamp with time zone,
    "reopens_at" timestamp with time zone
);


ALTER TABLE "public"."form_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hire_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "confirmation_code" character varying NOT NULL,
    "requester_name" "text" NOT NULL,
    "requester_email" character varying NOT NULL,
    "event_name" "text" NOT NULL,
    "event_type" character varying NOT NULL,
    "event_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "location" "text",
    "description" "text",
    "hourly_rate" numeric(10,2) NOT NULL,
    "duration_hours" numeric(4,2) NOT NULL,
    "total_cost" numeric(10,2) NOT NULL,
    "status" character varying DEFAULT 'pending'::character varying,
    "claimed_by" character varying,
    "claimed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "photographer_notes" "text",
    "photo_urls" "text"[] DEFAULT '{}'::"text"[],
    "photos_submitted_at" timestamp with time zone,
    CONSTRAINT "hire_requests_event_type_check" CHECK ((("event_type")::"text" = ANY ((ARRAY['conference'::character varying, 'performance'::character varying, 'social'::character varying, 'competition'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "hire_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'claimed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."hire_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."living_group_manual_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "living_group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "section_name" "text",
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."living_group_manual_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."living_group_manual_members" IS 'Simple text-based member list for living groups. Part of the membership simplification (Jan 2026).';



CREATE TABLE IF NOT EXISTS "public"."living_group_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "living_group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "membership_type" character varying NOT NULL,
    "status" character varying DEFAULT 'active'::character varying NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "section_name" "text",
    CONSTRAINT "living_group_memberships_membership_type_check" CHECK ((("membership_type")::"text" = ANY ((ARRAY['dorm'::character varying, 'fsilg'::character varying])::"text"[]))),
    CONSTRAINT "living_group_memberships_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'removed'::character varying])::"text"[])))
);


ALTER TABLE "public"."living_group_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."living_group_time_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photoshoot_time_id" "uuid" NOT NULL,
    "living_group_id" "uuid" NOT NULL,
    "section_name" "text",
    "slot_start" time without time zone NOT NULL,
    "slot_end" time without time zone NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."living_group_time_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."living_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "disabled_by" "uuid",
    "disabled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "living_group_type" character varying DEFAULT 'dorm'::character varying,
    "affiliation" "text",
    "document_links" "text",
    "document_notes" "text",
    "dorm_sections" "text"[] DEFAULT '{}'::"text"[],
    "section_images" "jsonb" DEFAULT '{}'::"jsonb",
    "manually_booked" boolean DEFAULT false,
    "manually_booked_by" "uuid",
    "candid_image_1" "text",
    "candid_image_2" "text",
    "candid_image_3" "text",
    "candid_image_4" "text",
    "description" "text",
    CONSTRAINT "living_groups_living_group_type_check" CHECK ((("living_group_type")::"text" = ANY ((ARRAY['dorm'::character varying, 'fsilg'::character varying])::"text"[]))),
    CONSTRAINT "living_groups_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'disabled'::character varying, 'pending'::character varying])::"text"[])))
);


ALTER TABLE "public"."living_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photographer_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "is_active" boolean DEFAULT false,
    "revoked_by" "uuid",
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photographer_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."photographer_permissions" IS 'Tracks approved photographers. Admin-only approval required. Photographers can post times and accept LG proposals.';



CREATE TABLE IF NOT EXISTS "public"."photoshoot_times" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "living_group_id" "uuid",
    "booked_at" timestamp with time zone,
    "booked_by" "uuid",
    "cancellation_requested" boolean DEFAULT false,
    "cancellation_request_reason" "text",
    "cancellation_approved" boolean,
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "uuid",
    "created_by" "uuid" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "location" "text",
    "proposed_locations" "text"[],
    "booking_status" character varying,
    "photographer_id" "uuid",
    "photographer_assigned_at" timestamp with time zone,
    "photographer_assigned_by" "uuid",
    CONSTRAINT "photoshoot_times_booking_status_check" CHECK ((("booking_status" IS NULL) OR (("booking_status")::"text" = ANY ((ARRAY['pending_location'::character varying, 'confirmed'::character varying])::"text"[]))))
);


ALTER TABLE "public"."photoshoot_times" OWNER TO "postgres";


COMMENT ON COLUMN "public"."photoshoot_times"."photographer_id" IS 'The photographer assigned to this photoshoot';



COMMENT ON COLUMN "public"."photoshoot_times"."photographer_assigned_at" IS 'When the photographer was assigned';



COMMENT ON COLUMN "public"."photoshoot_times"."photographer_assigned_by" IS 'Admin who assigned the photographer';



CREATE TABLE IF NOT EXISTS "public"."senior_bios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "major" character varying,
    "second_major" character varying,
    "quote" "text",
    "achievements" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "minor" "text",
    "first_name" "text",
    "last_name" "text",
    "major_backup" "text",
    "photo_preference" character varying
);


ALTER TABLE "public"."senior_bios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."senior_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."senior_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "access_token" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "code_verifier" "text",
    "state" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "has_gender_teams" boolean DEFAULT false,
    "achievement_summary" "text",
    "candid_image_1" "text",
    "candid_image_2" "text",
    "candid_image_3" "text",
    "mens_achievement_summary" "text",
    "mens_candid_image_1" "text",
    "mens_candid_image_2" "text",
    "mens_candid_image_3" "text",
    "womens_achievement_summary" "text",
    "womens_candid_image_1" "text",
    "womens_candid_image_2" "text",
    "womens_candid_image_3" "text",
    "document_links" "text",
    "document_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sports_coaches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sports_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sports_coaches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sports_manual_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sports_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "team" "text",
    "added_at" timestamp with time zone DEFAULT "now"(),
    "role" "text",
    CONSTRAINT "sports_manual_members_team_check" CHECK ((("team" IS NULL) OR ("team" = ANY (ARRAY['mens'::"text", 'womens'::"text"]))))
);


ALTER TABLE "public"."sports_manual_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_work_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying NOT NULL,
    "members" "text"[] NOT NULL,
    "additional_credits" "text",
    "project_title" "text" NOT NULL,
    "project_description" "text" NOT NULL,
    "links" "text",
    "image_urls" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_work_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "living_group_id" "uuid" NOT NULL,
    "proposed_by" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "location" "text",
    "notes" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "accepted_by" "uuid",
    "accepted_at" timestamp with time zone,
    "declined_by" "uuid",
    "declined_at" timestamp with time zone,
    "decline_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "time_proposals_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."time_proposals" OWNER TO "postgres";


COMMENT ON TABLE "public"."time_proposals" IS 'Living groups can propose times for photographers to accept. Part of bidirectional scheduling system.';



COMMENT ON COLUMN "public"."time_proposals"."status" IS 'pending = awaiting photographer response, accepted = converted to photoshoot_time, declined = photographer rejected, cancelled = LG withdrew proposal';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(50) DEFAULT 'student'::character varying NOT NULL,
    "supabase_auth_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_staph" boolean DEFAULT false,
    "access" "text"[] DEFAULT '{}'::"text"[],
    "name" "text",
    "login_key_encrypted" "text",
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY (ARRAY['admin'::"text", 'staph'::"text", 'club'::"text", 'living_group'::"text", 'student'::"text", 'sports'::"text", 'photographer'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."yearbook_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" integer NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."yearbook_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."yearbook_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" character varying NOT NULL,
    "name" "text" NOT NULL,
    "email" character varying NOT NULL,
    "student_name" "text",
    "graduation_year" "text",
    "year_requested" integer NOT NULL,
    "shipping_address" "text",
    "shipping_city" "text",
    "shipping_state" "text",
    "shipping_zip" "text",
    "message" "text",
    "status" character varying DEFAULT 'pending'::character varying,
    "status_updated_by" "uuid",
    "status_updated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "yearbook_requests_source_check" CHECK ((("source")::"text" = ANY (ARRAY['parent'::"text", 'alumni'::"text"]))),
    CONSTRAINT "yearbook_requests_status_check" CHECK ((("status")::"text" = ANY (ARRAY['pending'::"text", 'fulfilled'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."yearbook_requests" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_candids"
    ADD CONSTRAINT "anonymous_candid_submissions_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."community_candids"
    ADD CONSTRAINT "anonymous_candid_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."authorized_photographers"
    ADD CONSTRAINT "authorized_photographers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."authorized_photographers"
    ADD CONSTRAINT "authorized_photographers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_manual_members"
    ADD CONSTRAINT "club_manual_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_unique" UNIQUE ("club_id", "user_id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_settings"
    ADD CONSTRAINT "form_settings_form_name_key" UNIQUE ("form_name");



ALTER TABLE ONLY "public"."form_settings"
    ADD CONSTRAINT "form_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hire_requests"
    ADD CONSTRAINT "hire_requests_confirmation_code_key" UNIQUE ("confirmation_code");



ALTER TABLE ONLY "public"."hire_requests"
    ADD CONSTRAINT "hire_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."living_group_manual_members"
    ADD CONSTRAINT "living_group_manual_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."living_group_memberships"
    ADD CONSTRAINT "living_group_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."living_group_time_assignments"
    ADD CONSTRAINT "living_group_time_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."living_group_time_assignments"
    ADD CONSTRAINT "living_group_time_assignments_unique" UNIQUE ("photoshoot_time_id", "slot_start", "slot_end");



ALTER TABLE ONLY "public"."living_groups"
    ADD CONSTRAINT "living_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."living_groups"
    ADD CONSTRAINT "living_groups_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."photographer_permissions"
    ADD CONSTRAINT "photographer_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photographer_permissions"
    ADD CONSTRAINT "photographer_permissions_user_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "photoshoot_times_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."senior_bios"
    ADD CONSTRAINT "senior_bios_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."senior_bios"
    ADD CONSTRAINT "senior_bios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."senior_photos"
    ADD CONSTRAINT "senior_photos_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."senior_photos"
    ADD CONSTRAINT "senior_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sports_coaches"
    ADD CONSTRAINT "sports_coaches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sports_manual_members"
    ADD CONSTRAINT "sports_manual_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_work_submissions"
    ADD CONSTRAINT "student_work_submissions_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."student_work_submissions"
    ADD CONSTRAINT "student_work_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_proposals"
    ADD CONSTRAINT "time_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "unique_time_slot" UNIQUE ("date", "start_time", "end_time");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."yearbook_inventory"
    ADD CONSTRAINT "yearbook_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."yearbook_inventory"
    ADD CONSTRAINT "yearbook_inventory_year_key" UNIQUE ("year");



ALTER TABLE ONLY "public"."yearbook_requests"
    ADD CONSTRAINT "yearbook_requests_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_logs_action_type" ON "public"."admin_logs" USING "btree" ("action_type");



CREATE INDEX "idx_admin_logs_actor" ON "public"."admin_logs" USING "btree" ("actor_id");



CREATE INDEX "idx_admin_logs_created_at" ON "public"."admin_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_club_manual_members_club" ON "public"."club_manual_members" USING "btree" ("club_id");



CREATE INDEX "idx_club_manual_members_section" ON "public"."club_manual_members" USING "btree" ("club_id", "section_name");



CREATE INDEX "idx_club_memberships_club" ON "public"."club_memberships" USING "btree" ("club_id");



CREATE INDEX "idx_club_memberships_user" ON "public"."club_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_clubs_approval_status" ON "public"."clubs" USING "btree" ("approval_status");



CREATE INDEX "idx_clubs_user_id" ON "public"."clubs" USING "btree" ("user_id");



CREATE INDEX "idx_lgm_living_group" ON "public"."living_group_memberships" USING "btree" ("living_group_id");



CREATE INDEX "idx_lgm_status" ON "public"."living_group_memberships" USING "btree" ("status");



CREATE INDEX "idx_lgm_user" ON "public"."living_group_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_lgta_living_group" ON "public"."living_group_time_assignments" USING "btree" ("living_group_id");



CREATE INDEX "idx_lgta_photoshoot" ON "public"."living_group_time_assignments" USING "btree" ("photoshoot_time_id");



CREATE INDEX "idx_lgta_section" ON "public"."living_group_time_assignments" USING "btree" ("section_name");



CREATE INDEX "idx_living_group_manual_members_lg_id" ON "public"."living_group_manual_members" USING "btree" ("living_group_id");



CREATE INDEX "idx_living_groups_dorm_sections" ON "public"."living_groups" USING "gin" ("dorm_sections");



CREATE INDEX "idx_living_groups_status" ON "public"."living_groups" USING "btree" ("status");



CREATE INDEX "idx_living_groups_user_id" ON "public"."living_groups" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_one_dorm_per_user" ON "public"."living_group_memberships" USING "btree" ("user_id") WHERE ((("membership_type")::"text" = 'dorm'::"text") AND (("status")::"text" = 'active'::"text"));



CREATE UNIQUE INDEX "idx_one_fsilg_per_user" ON "public"."living_group_memberships" USING "btree" ("user_id") WHERE ((("membership_type")::"text" = 'fsilg'::"text") AND (("status")::"text" = 'active'::"text"));



CREATE INDEX "idx_photographer_permissions_active" ON "public"."photographer_permissions" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_photographer_permissions_user" ON "public"."photographer_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_photoshoot_times_date" ON "public"."photoshoot_times" USING "btree" ("date");



CREATE INDEX "idx_photoshoot_times_living_group" ON "public"."photoshoot_times" USING "btree" ("living_group_id");



CREATE INDEX "idx_photoshoot_times_photographer_id" ON "public"."photoshoot_times" USING "btree" ("photographer_id");



CREATE INDEX "idx_sessions_expires_at" ON "public"."sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_sessions_user_id" ON "public"."sessions" USING "btree" ("user_id");



CREATE INDEX "idx_sports_coaches_sports_id" ON "public"."sports_coaches" USING "btree" ("sports_id");



CREATE INDEX "idx_sports_manual_members_sports_id" ON "public"."sports_manual_members" USING "btree" ("sports_id");



CREATE INDEX "idx_sports_manual_members_team" ON "public"."sports_manual_members" USING "btree" ("team");



CREATE INDEX "idx_sports_name" ON "public"."sports" USING "btree" ("name");



CREATE INDEX "idx_sports_user_id" ON "public"."sports" USING "btree" ("user_id");



CREATE INDEX "idx_time_proposals_date" ON "public"."time_proposals" USING "btree" ("date");



CREATE INDEX "idx_time_proposals_living_group" ON "public"."time_proposals" USING "btree" ("living_group_id");



CREATE INDEX "idx_time_proposals_pending" ON "public"."time_proposals" USING "btree" ("status") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX "idx_time_proposals_status" ON "public"."time_proposals" USING "btree" ("status");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_yearbook_inventory_year" ON "public"."yearbook_inventory" USING "btree" ("year");



CREATE INDEX "senior_photos_email_idx" ON "public"."senior_photos" USING "btree" ("email");



CREATE OR REPLACE TRIGGER "enforce_max_leaders" BEFORE INSERT OR UPDATE ON "public"."club_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."check_max_leaders"();



CREATE OR REPLACE TRIGGER "update_clubs_updated_at" BEFORE UPDATE ON "public"."clubs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_form_settings_updated_at" BEFORE UPDATE ON "public"."form_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_living_groups_updated_at" BEFORE UPDATE ON "public"."living_groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_photoshoot_times_updated_at" BEFORE UPDATE ON "public"."photoshoot_times" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."authorized_photographers"
    ADD CONSTRAINT "authorized_photographers_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."club_manual_members"
    ADD CONSTRAINT "club_manual_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_memberships"
    ADD CONSTRAINT "club_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_settings"
    ADD CONSTRAINT "form_settings_frozen_by_fkey" FOREIGN KEY ("frozen_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."form_settings"
    ADD CONSTRAINT "form_settings_unfrozen_by_fkey" FOREIGN KEY ("unfrozen_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."living_group_manual_members"
    ADD CONSTRAINT "living_group_manual_members_living_group_id_fkey" FOREIGN KEY ("living_group_id") REFERENCES "public"."living_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."living_group_memberships"
    ADD CONSTRAINT "living_group_memberships_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."living_group_memberships"
    ADD CONSTRAINT "living_group_memberships_living_group_fkey" FOREIGN KEY ("living_group_id") REFERENCES "public"."living_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."living_group_memberships"
    ADD CONSTRAINT "living_group_memberships_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."living_group_time_assignments"
    ADD CONSTRAINT "living_group_time_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."living_group_time_assignments"
    ADD CONSTRAINT "living_group_time_assignments_living_group_fkey" FOREIGN KEY ("living_group_id") REFERENCES "public"."living_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."living_group_time_assignments"
    ADD CONSTRAINT "living_group_time_assignments_photoshoot_fkey" FOREIGN KEY ("photoshoot_time_id") REFERENCES "public"."photoshoot_times"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."living_groups"
    ADD CONSTRAINT "living_groups_disabled_by_fkey" FOREIGN KEY ("disabled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."living_groups"
    ADD CONSTRAINT "living_groups_manually_booked_by_fkey" FOREIGN KEY ("manually_booked_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."living_groups"
    ADD CONSTRAINT "living_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photographer_permissions"
    ADD CONSTRAINT "photographer_permissions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."photographer_permissions"
    ADD CONSTRAINT "photographer_permissions_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."photographer_permissions"
    ADD CONSTRAINT "photographer_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "photoshoot_times_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "photoshoot_times_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "photoshoot_times_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "photoshoot_times_living_group_id_fkey" FOREIGN KEY ("living_group_id") REFERENCES "public"."living_groups"("id");



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "photoshoot_times_photographer_assigned_by_fkey" FOREIGN KEY ("photographer_assigned_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."photoshoot_times"
    ADD CONSTRAINT "photoshoot_times_photographer_id_fkey" FOREIGN KEY ("photographer_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sports_coaches"
    ADD CONSTRAINT "sports_coaches_sports_id_fkey" FOREIGN KEY ("sports_id") REFERENCES "public"."sports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sports_manual_members"
    ADD CONSTRAINT "sports_manual_members_sports_id_fkey" FOREIGN KEY ("sports_id") REFERENCES "public"."sports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sports"
    ADD CONSTRAINT "sports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."time_proposals"
    ADD CONSTRAINT "time_proposals_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."time_proposals"
    ADD CONSTRAINT "time_proposals_declined_by_fkey" FOREIGN KEY ("declined_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."time_proposals"
    ADD CONSTRAINT "time_proposals_living_group_id_fkey" FOREIGN KEY ("living_group_id") REFERENCES "public"."living_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_proposals"
    ADD CONSTRAINT "time_proposals_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_supabase_auth_id_fkey" FOREIGN KEY ("supabase_auth_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."yearbook_inventory"
    ADD CONSTRAINT "yearbook_inventory_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."yearbook_requests"
    ADD CONSTRAINT "yearbook_requests_status_updated_by_fkey" FOREIGN KEY ("status_updated_by") REFERENCES "public"."users"("id");



CREATE POLICY "Admins can create any time assignment" ON "public"."living_group_time_assignments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."supabase_auth_id" = "auth"."uid"()) AND ((("u"."role")::"text" = 'admin'::"text") OR ("u"."is_staph" = true))))));



CREATE POLICY "Admins can delete any time assignment" ON "public"."living_group_time_assignments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."supabase_auth_id" = "auth"."uid"()) AND ((("u"."role")::"text" = 'admin'::"text") OR ("u"."is_staph" = true))))));



CREATE POLICY "Admins can update any time assignment" ON "public"."living_group_time_assignments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."supabase_auth_id" = "auth"."uid"()) AND ((("u"."role")::"text" = 'admin'::"text") OR ("u"."is_staph" = true))))));



CREATE POLICY "Admins can view all memberships" ON "public"."living_group_memberships" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."supabase_auth_id" = "auth"."uid"()) AND (("u"."role")::"text" = ANY ((ARRAY['admin'::character varying, 'staph'::character varying])::"text"[]))))));



CREATE POLICY "Admins can view all time assignments" ON "public"."living_group_time_assignments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."supabase_auth_id" = "auth"."uid"()) AND ((("u"."role")::"text" = 'admin'::"text") OR ("u"."is_staph" = true))))));



CREATE POLICY "Living group leaders can view their members" ON "public"."living_group_memberships" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."living_groups" "lg"
     JOIN "public"."users" "u" ON (("u"."id" = "lg"."user_id")))
  WHERE (("lg"."id" = "living_group_memberships"."living_group_id") AND ("u"."supabase_auth_id" = "auth"."uid"())))));



CREATE POLICY "Users can create time assignments for their LG" ON "public"."living_group_time_assignments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."living_groups" "lg"
     JOIN "public"."users" "u" ON (("u"."id" = "lg"."user_id")))
  WHERE (("lg"."id" = "living_group_time_assignments"."living_group_id") AND ("u"."supabase_auth_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete time assignments for their LG" ON "public"."living_group_time_assignments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."living_groups" "lg"
     JOIN "public"."users" "u" ON (("u"."id" = "lg"."user_id")))
  WHERE (("lg"."id" = "living_group_time_assignments"."living_group_id") AND ("u"."supabase_auth_id" = "auth"."uid"())))));



CREATE POLICY "Users can update time assignments for their LG" ON "public"."living_group_time_assignments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."living_groups" "lg"
     JOIN "public"."users" "u" ON (("u"."id" = "lg"."user_id")))
  WHERE (("lg"."id" = "living_group_time_assignments"."living_group_id") AND ("u"."supabase_auth_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their LG time assignments" ON "public"."living_group_time_assignments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."living_groups" "lg"
     JOIN "public"."users" "u" ON (("u"."id" = "lg"."user_id")))
  WHERE (("lg"."id" = "living_group_time_assignments"."living_group_id") AND ("u"."supabase_auth_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own memberships" ON "public"."living_group_memberships" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."supabase_auth_id" = "auth"."uid"()) AND ("u"."id" = "living_group_memberships"."user_id"))))));



ALTER TABLE "public"."admin_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins_view_all_members" ON "public"."living_group_manual_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."supabase_auth_id" = "auth"."uid"()) AND ((("u"."role")::"text" = 'admin'::"text") OR ("u"."is_staph" = true))))));



ALTER TABLE "public"."authorized_photographers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_manual_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hire_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."living_group_manual_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."living_group_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "living_group_owners_manage_members" ON "public"."living_group_manual_members" USING ((EXISTS ( SELECT 1
   FROM "public"."living_groups" "lg"
  WHERE (("lg"."id" = "living_group_manual_members"."living_group_id") AND ("lg"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."living_group_time_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."living_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photographer_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photoshoot_times" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sports_coaches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sports_coaches_delete_own" ON "public"."sports_coaches" FOR DELETE USING (("sports_id" IN ( SELECT "sports"."id"
   FROM "public"."sports"
  WHERE ("sports"."user_id" = "auth"."uid"()))));



CREATE POLICY "sports_coaches_insert_own" ON "public"."sports_coaches" FOR INSERT WITH CHECK (("sports_id" IN ( SELECT "sports"."id"
   FROM "public"."sports"
  WHERE ("sports"."user_id" = "auth"."uid"()))));



CREATE POLICY "sports_coaches_select_all" ON "public"."sports_coaches" FOR SELECT USING (true);



CREATE POLICY "sports_coaches_update_own" ON "public"."sports_coaches" FOR UPDATE USING (("sports_id" IN ( SELECT "sports"."id"
   FROM "public"."sports"
  WHERE ("sports"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."sports_manual_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sports_members_delete_own" ON "public"."sports_manual_members" FOR DELETE USING (("sports_id" IN ( SELECT "sports"."id"
   FROM "public"."sports"
  WHERE ("sports"."user_id" = "auth"."uid"()))));



CREATE POLICY "sports_members_insert_own" ON "public"."sports_manual_members" FOR INSERT WITH CHECK (("sports_id" IN ( SELECT "sports"."id"
   FROM "public"."sports"
  WHERE ("sports"."user_id" = "auth"."uid"()))));



CREATE POLICY "sports_members_select_all" ON "public"."sports_manual_members" FOR SELECT USING (true);



CREATE POLICY "sports_members_update_own" ON "public"."sports_manual_members" FOR UPDATE USING (("sports_id" IN ( SELECT "sports"."id"
   FROM "public"."sports"
  WHERE ("sports"."user_id" = "auth"."uid"()))));



CREATE POLICY "sports_select_all" ON "public"."sports" FOR SELECT USING (true);



CREATE POLICY "sports_update_own" ON "public"."sports" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."time_proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."yearbook_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."yearbook_requests" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_max_leaders"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_max_leaders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_max_leaders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_club_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_club_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_club_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_logs" TO "service_role";



GRANT ALL ON TABLE "public"."authorized_photographers" TO "anon";
GRANT ALL ON TABLE "public"."authorized_photographers" TO "authenticated";
GRANT ALL ON TABLE "public"."authorized_photographers" TO "service_role";



GRANT ALL ON TABLE "public"."club_manual_members" TO "anon";
GRANT ALL ON TABLE "public"."club_manual_members" TO "authenticated";
GRANT ALL ON TABLE "public"."club_manual_members" TO "service_role";



GRANT ALL ON TABLE "public"."club_memberships" TO "anon";
GRANT ALL ON TABLE "public"."club_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."club_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."clubs" TO "anon";
GRANT ALL ON TABLE "public"."clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."clubs" TO "service_role";



GRANT ALL ON TABLE "public"."community_candids" TO "anon";
GRANT ALL ON TABLE "public"."community_candids" TO "authenticated";
GRANT ALL ON TABLE "public"."community_candids" TO "service_role";



GRANT ALL ON TABLE "public"."form_settings" TO "anon";
GRANT ALL ON TABLE "public"."form_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."form_settings" TO "service_role";



GRANT ALL ON TABLE "public"."hire_requests" TO "anon";
GRANT ALL ON TABLE "public"."hire_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."hire_requests" TO "service_role";



GRANT ALL ON TABLE "public"."living_group_manual_members" TO "anon";
GRANT ALL ON TABLE "public"."living_group_manual_members" TO "authenticated";
GRANT ALL ON TABLE "public"."living_group_manual_members" TO "service_role";



GRANT ALL ON TABLE "public"."living_group_memberships" TO "anon";
GRANT ALL ON TABLE "public"."living_group_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."living_group_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."living_group_time_assignments" TO "anon";
GRANT ALL ON TABLE "public"."living_group_time_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."living_group_time_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."living_groups" TO "anon";
GRANT ALL ON TABLE "public"."living_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."living_groups" TO "service_role";



GRANT ALL ON TABLE "public"."photographer_permissions" TO "anon";
GRANT ALL ON TABLE "public"."photographer_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."photographer_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."photoshoot_times" TO "anon";
GRANT ALL ON TABLE "public"."photoshoot_times" TO "authenticated";
GRANT ALL ON TABLE "public"."photoshoot_times" TO "service_role";



GRANT ALL ON TABLE "public"."senior_bios" TO "anon";
GRANT ALL ON TABLE "public"."senior_bios" TO "authenticated";
GRANT ALL ON TABLE "public"."senior_bios" TO "service_role";



GRANT ALL ON TABLE "public"."senior_photos" TO "anon";
GRANT ALL ON TABLE "public"."senior_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."senior_photos" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."sports" TO "anon";
GRANT ALL ON TABLE "public"."sports" TO "authenticated";
GRANT ALL ON TABLE "public"."sports" TO "service_role";



GRANT ALL ON TABLE "public"."sports_coaches" TO "anon";
GRANT ALL ON TABLE "public"."sports_coaches" TO "authenticated";
GRANT ALL ON TABLE "public"."sports_coaches" TO "service_role";



GRANT ALL ON TABLE "public"."sports_manual_members" TO "anon";
GRANT ALL ON TABLE "public"."sports_manual_members" TO "authenticated";
GRANT ALL ON TABLE "public"."sports_manual_members" TO "service_role";



GRANT ALL ON TABLE "public"."student_work_submissions" TO "anon";
GRANT ALL ON TABLE "public"."student_work_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."student_work_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."time_proposals" TO "anon";
GRANT ALL ON TABLE "public"."time_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."time_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."yearbook_inventory" TO "anon";
GRANT ALL ON TABLE "public"."yearbook_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."yearbook_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."yearbook_requests" TO "anon";
GRANT ALL ON TABLE "public"."yearbook_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."yearbook_requests" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "Admins can view all memberships" on "public"."living_group_memberships";

alter table "public"."clubs" drop constraint "clubs_approval_status_check";

alter table "public"."hire_requests" drop constraint "hire_requests_event_type_check";

alter table "public"."hire_requests" drop constraint "hire_requests_status_check";

alter table "public"."living_group_memberships" drop constraint "living_group_memberships_membership_type_check";

alter table "public"."living_group_memberships" drop constraint "living_group_memberships_status_check";

alter table "public"."living_groups" drop constraint "living_groups_living_group_type_check";

alter table "public"."living_groups" drop constraint "living_groups_status_check";

alter table "public"."photoshoot_times" drop constraint "photoshoot_times_booking_status_check";

alter table "public"."time_proposals" drop constraint "time_proposals_status_check";

alter table "public"."clubs" add constraint "clubs_approval_status_check" CHECK (((approval_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'denied'::character varying])::text[]))) not valid;

alter table "public"."clubs" validate constraint "clubs_approval_status_check";

alter table "public"."hire_requests" add constraint "hire_requests_event_type_check" CHECK (((event_type)::text = ANY ((ARRAY['conference'::character varying, 'performance'::character varying, 'social'::character varying, 'competition'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."hire_requests" validate constraint "hire_requests_event_type_check";

alter table "public"."hire_requests" add constraint "hire_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'claimed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."hire_requests" validate constraint "hire_requests_status_check";

alter table "public"."living_group_memberships" add constraint "living_group_memberships_membership_type_check" CHECK (((membership_type)::text = ANY ((ARRAY['dorm'::character varying, 'fsilg'::character varying])::text[]))) not valid;

alter table "public"."living_group_memberships" validate constraint "living_group_memberships_membership_type_check";

alter table "public"."living_group_memberships" add constraint "living_group_memberships_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'removed'::character varying])::text[]))) not valid;

alter table "public"."living_group_memberships" validate constraint "living_group_memberships_status_check";

alter table "public"."living_groups" add constraint "living_groups_living_group_type_check" CHECK (((living_group_type)::text = ANY ((ARRAY['dorm'::character varying, 'fsilg'::character varying])::text[]))) not valid;

alter table "public"."living_groups" validate constraint "living_groups_living_group_type_check";

alter table "public"."living_groups" add constraint "living_groups_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'disabled'::character varying, 'pending'::character varying])::text[]))) not valid;

alter table "public"."living_groups" validate constraint "living_groups_status_check";

alter table "public"."photoshoot_times" add constraint "photoshoot_times_booking_status_check" CHECK (((booking_status IS NULL) OR ((booking_status)::text = ANY ((ARRAY['pending_location'::character varying, 'confirmed'::character varying])::text[])))) not valid;

alter table "public"."photoshoot_times" validate constraint "photoshoot_times_booking_status_check";

alter table "public"."time_proposals" add constraint "time_proposals_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."time_proposals" validate constraint "time_proposals_status_check";


  create policy "Admins can view all memberships"
  on "public"."living_group_memberships"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.supabase_auth_id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['admin'::character varying, 'staph'::character varying])::text[]))))));



  create policy "sports_images_delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'sports-images'::text));



  create policy "sports_images_insert"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'sports-images'::text));



  create policy "sports_images_select"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'sports-images'::text));



  create policy "sports_images_update"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'sports-images'::text));


CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


