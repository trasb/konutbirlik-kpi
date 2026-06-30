CREATE TABLE "raw_is_kayitlari" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "raw_is_kayitlari_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"period" text NOT NULL,
	"kpi_code" text NOT NULL,
	"mudurluk" text NOT NULL,
	"amirlik" text NOT NULL,
	"ekip_no" text DEFAULT '' NOT NULL,
	"kayit_no" text NOT NULL,
	"is_turu" text,
	"sure_saat" numeric(10, 2),
	"uyumlu" integer,
	"tamamlanma_tarihi" timestamp,
	"source_file" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "raw_is_kayitlari" ADD CONSTRAINT "raw_is_kayitlari_kpi_code_kpi_definitions_kpi_code_fk" FOREIGN KEY ("kpi_code") REFERENCES "public"."kpi_definitions"("kpi_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "raw_is_kayitlari_unique" ON "raw_is_kayitlari" USING btree ("period","kpi_code","kayit_no");