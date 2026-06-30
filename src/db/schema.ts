import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const directionEnum = pgEnum("direction", ["higher_better", "lower_better"]);
export const levelEnum = pgEnum("level", ["bolge", "mudurluk", "amirlik", "ekip"]);

// KPI kataloğu: her KPI kodunun adı, yönü (yüksek/düşük iyi) ve Altın hedefi.
export const kpiDefinitions = pgTable("kpi_definitions", {
  kpiCode: text("kpi_code").primaryKey(),
  name: text("name").notNull(),
  direction: directionEnum("direction").notNull(),
  unit: text("unit").notNull().default("percent"),
  targetGold: numeric("target_gold", { precision: 10, scale: 4 }),
  sourceFamily: text("source_family").notNull(),
});

// Her ay yüklenen KPI özet satırları (Müdürlük/Amirlik/Ekip bazlı Pay/Payda/Oran).
export const kpiMonthlyFacts = pgTable(
  "kpi_monthly_facts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    period: text("period").notNull(), // 'YYYY-MM'
    kpiCode: text("kpi_code")
      .notNull()
      .references(() => kpiDefinitions.kpiCode),
    level: levelEnum("level").notNull(),
    mudurluk: text("mudurluk").notNull(),
    // Boş string ("") = "uygulanmıyor" (örn. mudurluk seviyesinde amirlik/ekipNo).
    // NULL kullanılmıyor çünkü Postgres unique index'lerinde NULL != NULL, bu da
    // ON CONFLICT upsert'in mudurluk/bolge seviyesi satırlarda eşleşmemesine yol açar.
    amirlik: text("amirlik").notNull().default(""),
    ekipNo: text("ekip_no").notNull().default(""),
    numerator: numeric("numerator", { precision: 14, scale: 2 }),
    denominator: numeric("denominator", { precision: 14, scale: 2 }),
    oran: numeric("oran", { precision: 10, scale: 4 }),
    sourceFile: text("source_file"),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("kpi_monthly_facts_unique").on(
      t.period,
      t.kpiCode,
      t.level,
      t.mudurluk,
      t.amirlik,
      t.ekipNo,
    ),
  ],
);

// NVS (Net Verimlilik Skoru) dosyasından gelen, zaten birleştirilmiş aylık scorecard.
export const nvsMonthlyScores = pgTable(
  "nvs_monthly_scores",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    period: text("period").notNull(),
    level: levelEnum("level").notNull(),
    // Boş string ("") = "uygulanmıyor" (bkz. kpi_monthly_facts'teki aynı not).
    mudurluk: text("mudurluk").notNull().default(""),
    amirlik: text("amirlik").notNull().default(""),
    ekipNo: text("ekip_no").notNull().default(""),
    ekipFirmaTipi: text("ekip_firma_tipi"),
    toplamPuan: numeric("toplam_puan", { precision: 10, scale: 4 }),
    components: jsonb("components").notNull().default({}),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("nvs_monthly_scores_unique").on(
      t.period,
      t.level,
      t.mudurluk,
      t.amirlik,
      t.ekipNo,
    ),
  ],
);

// "GidişaTT Ara Bilgilendirme" dosyasından gelen, MÜDÜRLÜK seviyesinde bölge-içi sıralama/skor
// (amirlik/ekip kırılımı yok — bu rapor müdürlükleri birbiriyle kıyaslıyor).
export const gidisatMudurlukScores = pgTable(
  "gidisat_mudurluk_scores",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    period: text("period").notNull(),
    mudurluk: text("mudurluk").notNull(),
    sira: integer("sira"),
    skor: numeric("skor", { precision: 10, scale: 4 }),
    // Hamdata sayfasındaki ham KPI değerleri: { "<kolon başlığı>": <değer> }
    kpiValues: jsonb("kpi_values").notNull().default({}),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("gidisat_mudurluk_scores_unique").on(t.period, t.mudurluk)],
);

// Kullanıcının her KPI için belirlediği özel hedef (varsayılan: kpiDefinitions.targetGold).
export const goals = pgTable("goals", {
  kpiCode: text("kpi_code")
    .primaryKey()
    .references(() => kpiDefinitions.kpiCode),
  targetValue: numeric("target_value", { precision: 10, scale: 4 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
