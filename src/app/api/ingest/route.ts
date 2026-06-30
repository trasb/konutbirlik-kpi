import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { gidisatMudurlukScores, kpiMonthlyFacts, nvsMonthlyScores } from "@/db/schema";
import { sql } from "drizzle-orm";
import type { FactRow, NvsRow } from "@/lib/parsing/types";
import type { GidisatRow } from "@/lib/parsing/gidisat";

type IngestPayload = {
  facts: FactRow[];
  nvsRows: NvsRow[];
  gidisatRows?: GidisatRow[];
};

const CHUNK_SIZE = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Aynı upsert anahtarına sahip satırları tekilleştirir (sonuncusu kazanır).
 * Postgres "ON CONFLICT DO UPDATE" tek bir INSERT içinde aynı satıra iki kez dokunamaz;
 * kaynak Excel'de aynı isimle (örn. iki farklı İl altında) tekrar eden satırlar olabiliyor.
 */
function dedupeByKey<T>(rows: T[], keyFn: (row: T) => string): T[] {
  const map = new Map<string, T>();
  for (const row of rows) map.set(keyFn(row), row);
  return [...map.values()];
}

export async function POST(req: NextRequest) {
  let payload: IngestPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const facts = dedupeByKey(Array.isArray(payload.facts) ? payload.facts : [], (f) =>
    [f.period, f.kpiCode, f.level, f.mudurluk, f.amirlik, f.ekipNo].join("|"),
  );
  const nvsRows = dedupeByKey(Array.isArray(payload.nvsRows) ? payload.nvsRows : [], (r) =>
    [r.period, r.level, r.mudurluk, r.amirlik, r.ekipNo].join("|"),
  );
  const gidisatRows = dedupeByKey(
    Array.isArray(payload.gidisatRows) ? payload.gidisatRows : [],
    (r) => [r.period, r.mudurluk].join("|"),
  );

  if (facts.length === 0 && nvsRows.length === 0 && gidisatRows.length === 0) {
    return NextResponse.json({ error: "facts, nvsRows veya gidisatRows boş olamaz" }, { status: 400 });
  }

  let factsWritten = 0;
  for (const batch of chunk(facts, CHUNK_SIZE)) {
    await db
      .insert(kpiMonthlyFacts)
      .values(
        batch.map((f) => ({
          period: f.period,
          kpiCode: f.kpiCode,
          level: f.level,
          mudurluk: f.mudurluk,
          amirlik: f.amirlik,
          ekipNo: f.ekipNo,
          numerator: f.numerator === null ? null : String(f.numerator),
          denominator: f.denominator === null ? null : String(f.denominator),
          oran: f.oran === null ? null : String(f.oran),
          sourceFile: f.sourceFile,
        })),
      )
      .onConflictDoUpdate({
        target: [
          kpiMonthlyFacts.period,
          kpiMonthlyFacts.kpiCode,
          kpiMonthlyFacts.level,
          kpiMonthlyFacts.mudurluk,
          kpiMonthlyFacts.amirlik,
          kpiMonthlyFacts.ekipNo,
        ],
        // Aynı KPI hem NVS (sadece oran, ham sayı yok) hem de ayrı bir detay dosyasından
        // (Pay/Payda dahil) gelebiliyor — ikisinin hesabı birebir aynı olmuyor. Hangisi
        // sonra yüklenirse yüklensin, Pay/Payda içeren "zengin" veri her zaman kazanır;
        // ham sayısız (oran-only) bir yükleme var olan zengin veriyi silmez. Bu olmadan,
        // örn. T25 detay dosyasından sonra NVS yüklenirse, NVS'in ham sayısı olmayan kendi
        // oranı, T25'in gerçek Pay/Payda'sını silip "hedefe ulaşmak için kaç iş lazım"
        // hesabını bozardı.
        set: {
          numerator: sql`CASE WHEN excluded.numerator IS NOT NULL OR kpi_monthly_facts.numerator IS NULL THEN excluded.numerator ELSE kpi_monthly_facts.numerator END`,
          denominator: sql`CASE WHEN excluded.numerator IS NOT NULL OR kpi_monthly_facts.numerator IS NULL THEN excluded.denominator ELSE kpi_monthly_facts.denominator END`,
          oran: sql`CASE WHEN excluded.numerator IS NOT NULL OR kpi_monthly_facts.numerator IS NULL THEN excluded.oran ELSE kpi_monthly_facts.oran END`,
          sourceFile: sql`CASE WHEN excluded.numerator IS NOT NULL OR kpi_monthly_facts.numerator IS NULL THEN excluded.source_file ELSE kpi_monthly_facts.source_file END`,
          uploadedAt: sql`now()`,
        },
      });
    factsWritten += batch.length;
  }

  let nvsWritten = 0;
  for (const batch of chunk(nvsRows, CHUNK_SIZE)) {
    await db
      .insert(nvsMonthlyScores)
      .values(
        batch.map((r) => ({
          period: r.period,
          level: r.level,
          mudurluk: r.mudurluk,
          amirlik: r.amirlik,
          ekipNo: r.ekipNo,
          ekipFirmaTipi: r.ekipFirmaTipi,
          toplamPuan: r.toplamPuan === null ? null : String(r.toplamPuan),
          components: r.components,
        })),
      )
      .onConflictDoUpdate({
        target: [
          nvsMonthlyScores.period,
          nvsMonthlyScores.level,
          nvsMonthlyScores.mudurluk,
          nvsMonthlyScores.amirlik,
          nvsMonthlyScores.ekipNo,
        ],
        set: {
          ekipFirmaTipi: sql`excluded.ekip_firma_tipi`,
          toplamPuan: sql`excluded.toplam_puan`,
          components: sql`excluded.components`,
          uploadedAt: sql`now()`,
        },
      });
    nvsWritten += batch.length;
  }

  let gidisatWritten = 0;
  for (const batch of chunk(gidisatRows, CHUNK_SIZE)) {
    await db
      .insert(gidisatMudurlukScores)
      .values(
        batch.map((r) => ({
          period: r.period,
          mudurluk: r.mudurluk,
          sira: r.sira,
          skor: r.skor === null ? null : String(r.skor),
          kpiValues: r.kpiValues,
        })),
      )
      .onConflictDoUpdate({
        target: [gidisatMudurlukScores.period, gidisatMudurlukScores.mudurluk],
        set: {
          sira: sql`excluded.sira`,
          skor: sql`excluded.skor`,
          kpiValues: sql`excluded.kpi_values`,
          uploadedAt: sql`now()`,
        },
      });
    gidisatWritten += batch.length;
  }

  return NextResponse.json({ factsWritten, nvsWritten, gidisatWritten });
}
