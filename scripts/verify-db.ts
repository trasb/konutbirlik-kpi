import { db } from "../src/db";
import { kpiMonthlyFacts, nvsMonthlyScores, kpiDefinitions } from "../src/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function main() {
  const amirlikRow = await db
    .select()
    .from(nvsMonthlyScores)
    .where(
      and(
        eq(nvsMonthlyScores.level, "amirlik"),
        eq(nvsMonthlyScores.amirlik, "KONUTBİRLİK SAHA AMİRLİĞİ"),
      ),
    );
  console.log("KONUTBİRLİK amirlik nvs satırı:", amirlikRow.length);
  console.log(JSON.stringify(amirlikRow[0], null, 2));

  const ekipFacts = await db
    .select()
    .from(kpiMonthlyFacts)
    .where(
      and(
        eq(kpiMonthlyFacts.level, "ekip"),
        eq(kpiMonthlyFacts.amirlik, "KONUTBİRLİK SAHA AMİRLİĞİ"),
        eq(kpiMonthlyFacts.kpiCode, "T25_KURULUM_TAMAMLANMA"),
      ),
    );
  console.log("\nKONUTBİRLİK ekip T25 fact sayısı:", ekipFacts.length);
  console.table(
    ekipFacts.map((f) => ({
      ekip: f.ekipNo,
      pay: f.numerator,
      payda: f.denominator,
      oran: f.oran,
    })),
  );

  const totalFacts = await db.select({ count: sql<number>`count(*)` }).from(kpiMonthlyFacts);
  const totalNvs = await db.select({ count: sql<number>`count(*)` }).from(nvsMonthlyScores);
  const totalKpis = await db.select({ count: sql<number>`count(*)` }).from(kpiDefinitions);
  console.log("\nToplam kpi_monthly_facts:", totalFacts[0].count);
  console.log("Toplam nvs_monthly_scores:", totalNvs[0].count);
  console.log("Toplam kpi_definitions:", totalKpis[0].count);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
