import { db } from "@/db";
import { kpiDefinitions, kpiMonthlyFacts, nvsMonthlyScores, goals } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

export const DEFAULT_MUDURLUK = "İKİTELLİ";
export const DEFAULT_AMIRLIK = "KONUTBİRLİK SAHA AMİRLİĞİ";

function num(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type AmirlikOption = { mudurluk: string; amirlik: string };

export async function listAmirlikler(): Promise<AmirlikOption[]> {
  const rows = await db
    .selectDistinct({ mudurluk: nvsMonthlyScores.mudurluk, amirlik: nvsMonthlyScores.amirlik })
    .from(nvsMonthlyScores)
    .where(and(eq(nvsMonthlyScores.level, "amirlik")))
    .orderBy(nvsMonthlyScores.mudurluk, nvsMonthlyScores.amirlik);
  return rows.filter((r) => r.amirlik !== "");
}

export async function listPeriods(): Promise<string[]> {
  const [a, b] = await Promise.all([
    db.selectDistinct({ period: nvsMonthlyScores.period }).from(nvsMonthlyScores),
    db.selectDistinct({ period: kpiMonthlyFacts.period }).from(kpiMonthlyFacts),
  ]);
  const set = new Set([...a.map((r) => r.period), ...b.map((r) => r.period)]);
  return [...set].sort().reverse();
}

export async function getLatestPeriod(): Promise<string | null> {
  const periods = await listPeriods();
  return periods[0] ?? null;
}

export type NvsTrendPoint = { period: string; toplamPuan: number | null };

export async function getNvsTrend(mudurluk: string, amirlik: string): Promise<NvsTrendPoint[]> {
  const rows = await db
    .select({ period: nvsMonthlyScores.period, toplamPuan: nvsMonthlyScores.toplamPuan })
    .from(nvsMonthlyScores)
    .where(
      and(
        eq(nvsMonthlyScores.level, "amirlik"),
        eq(nvsMonthlyScores.mudurluk, mudurluk),
        eq(nvsMonthlyScores.amirlik, amirlik),
      ),
    )
    .orderBy(nvsMonthlyScores.period);
  return rows.map((r) => ({ period: r.period, toplamPuan: num(r.toplamPuan) }));
}

export type KpiCard = {
  kpiCode: string;
  name: string;
  direction: "higher_better" | "lower_better";
  unit: string;
  target: number | null;
  oran: number | null;
  numerator: number | null;
  denominator: number | null;
  gap: number | null; // hedefe ulaşmak için gereken ek başarı / azaltılması gereken hata sayısı
  onTarget: boolean | null;
};

export async function getKpiCards(
  mudurluk: string,
  amirlik: string,
  period: string,
): Promise<KpiCard[]> {
  const [defs, goalRows, factRows] = await Promise.all([
    db.select().from(kpiDefinitions).orderBy(kpiDefinitions.sourceFamily, kpiDefinitions.kpiCode),
    db.select().from(goals),
    db
      .select()
      .from(kpiMonthlyFacts)
      .where(
        and(
          eq(kpiMonthlyFacts.level, "amirlik"),
          eq(kpiMonthlyFacts.period, period),
          eq(kpiMonthlyFacts.mudurluk, mudurluk),
          eq(kpiMonthlyFacts.amirlik, amirlik),
        ),
      ),
  ]);

  const goalByCode = new Map(goalRows.map((g) => [g.kpiCode, num(g.targetValue)]));
  const factByCode = new Map(factRows.map((f) => [f.kpiCode, f]));

  return defs.map((def) => {
    const fact = factByCode.get(def.kpiCode);
    const target = goalByCode.get(def.kpiCode) ?? num(def.targetGold);
    const oran = fact ? num(fact.oran) : null;
    const numerator = fact ? num(fact.numerator) : null;
    const denominator = fact ? num(fact.denominator) : null;

    let gap: number | null = null;
    let onTarget: boolean | null = null;
    if (target !== null && oran !== null) {
      onTarget = def.direction === "higher_better" ? oran >= target : oran <= target;
    }
    if (target !== null && numerator !== null && denominator !== null) {
      if (def.direction === "higher_better") {
        const needed = Math.ceil((target / 100) * denominator - numerator);
        gap = Math.max(needed, 0);
      } else {
        const maxAllowed = Math.floor((target / 100) * denominator);
        gap = Math.max(numerator - maxAllowed, 0);
      }
    }

    return {
      kpiCode: def.kpiCode,
      name: def.name,
      direction: def.direction,
      unit: def.unit,
      target,
      oran,
      numerator,
      denominator,
      gap,
      onTarget,
    };
  });
}

export async function getKpiDefinition(kpiCode: string) {
  const rows = await db.select().from(kpiDefinitions).where(eq(kpiDefinitions.kpiCode, kpiCode));
  return rows[0] ?? null;
}

export type KpiTrendPoint = { period: string; oran: number | null };

export async function getKpiTrend(
  kpiCode: string,
  mudurluk: string,
  amirlik: string,
): Promise<KpiTrendPoint[]> {
  const rows = await db
    .select({ period: kpiMonthlyFacts.period, oran: kpiMonthlyFacts.oran })
    .from(kpiMonthlyFacts)
    .where(
      and(
        eq(kpiMonthlyFacts.kpiCode, kpiCode),
        eq(kpiMonthlyFacts.level, "amirlik"),
        eq(kpiMonthlyFacts.mudurluk, mudurluk),
        eq(kpiMonthlyFacts.amirlik, amirlik),
      ),
    )
    .orderBy(kpiMonthlyFacts.period);
  return rows.map((r) => ({ period: r.period, oran: num(r.oran) }));
}

export type EkipRow = {
  ekipNo: string;
  oran: number | null;
  numerator: number | null;
  denominator: number | null;
};

export async function getKpiEkipTable(
  kpiCode: string,
  mudurluk: string,
  amirlik: string,
  period: string,
): Promise<EkipRow[]> {
  const rows = await db
    .select()
    .from(kpiMonthlyFacts)
    .where(
      and(
        eq(kpiMonthlyFacts.kpiCode, kpiCode),
        eq(kpiMonthlyFacts.level, "ekip"),
        eq(kpiMonthlyFacts.mudurluk, mudurluk),
        eq(kpiMonthlyFacts.amirlik, amirlik),
        eq(kpiMonthlyFacts.period, period),
      ),
    )
    .orderBy(kpiMonthlyFacts.ekipNo);
  return rows.map((r) => ({
    ekipNo: r.ekipNo,
    oran: num(r.oran),
    numerator: num(r.numerator),
    denominator: num(r.denominator),
  }));
}

export async function getAllKpiDefinitionsWithGoals() {
  const [defs, goalRows] = await Promise.all([
    db.select().from(kpiDefinitions).orderBy(kpiDefinitions.sourceFamily, kpiDefinitions.kpiCode),
    db.select().from(goals),
  ]);
  const goalByCode = new Map(goalRows.map((g) => [g.kpiCode, num(g.targetValue)]));
  return defs.map((d) => ({
    ...d,
    targetGold: num(d.targetGold),
    effectiveTarget: goalByCode.get(d.kpiCode) ?? num(d.targetGold),
    hasOverride: goalByCode.has(d.kpiCode),
  }));
}
