CREATE TYPE "public"."direction" AS ENUM('higher_better', 'lower_better');--> statement-breakpoint
CREATE TYPE "public"."level" AS ENUM('bolge', 'mudurluk', 'amirlik', 'ekip');--> statement-breakpoint
CREATE TABLE "goals" (
	"kpi_code" text PRIMARY KEY NOT NULL,
	"target_value" numeric(10, 4) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_definitions" (
	"kpi_code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"direction" "direction" NOT NULL,
	"unit" text DEFAULT 'percent' NOT NULL,
	"target_gold" numeric(10, 4),
	"source_family" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_monthly_facts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kpi_monthly_facts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"period" text NOT NULL,
	"kpi_code" text NOT NULL,
	"level" "level" NOT NULL,
	"mudurluk" text NOT NULL,
	"amirlik" text,
	"ekip_no" text,
	"numerator" numeric(14, 2),
	"denominator" numeric(14, 2),
	"oran" numeric(10, 4),
	"source_file" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nvs_monthly_scores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nvs_monthly_scores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"period" text NOT NULL,
	"level" "level" NOT NULL,
	"mudurluk" text,
	"amirlik" text,
	"ekip_no" text,
	"ekip_firma_tipi" text,
	"toplam_puan" numeric(10, 4),
	"components" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_kpi_code_kpi_definitions_kpi_code_fk" FOREIGN KEY ("kpi_code") REFERENCES "public"."kpi_definitions"("kpi_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_monthly_facts" ADD CONSTRAINT "kpi_monthly_facts_kpi_code_kpi_definitions_kpi_code_fk" FOREIGN KEY ("kpi_code") REFERENCES "public"."kpi_definitions"("kpi_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kpi_monthly_facts_unique" ON "kpi_monthly_facts" USING btree ("period","kpi_code","level","mudurluk","amirlik","ekip_no");--> statement-breakpoint
CREATE UNIQUE INDEX "nvs_monthly_scores_unique" ON "nvs_monthly_scores" USING btree ("period","level","mudurluk","amirlik","ekip_no");