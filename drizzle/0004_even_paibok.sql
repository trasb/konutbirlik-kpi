CREATE TABLE "gidisat_amirlik_scores" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "gidisat_amirlik_scores_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"period" text NOT NULL,
	"mudurluk" text NOT NULL,
	"amirlik" text NOT NULL,
	"kpi_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "gidisat_amirlik_scores_unique" ON "gidisat_amirlik_scores" USING btree ("period","mudurluk","amirlik");