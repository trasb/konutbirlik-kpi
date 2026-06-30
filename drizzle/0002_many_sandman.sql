CREATE TABLE "gidisat_mudurluk_scores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gidisat_mudurluk_scores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"period" text NOT NULL,
	"mudurluk" text NOT NULL,
	"sira" integer,
	"skor" numeric(10, 4),
	"kpi_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "gidisat_mudurluk_scores_unique" ON "gidisat_mudurluk_scores" USING btree ("period","mudurluk");