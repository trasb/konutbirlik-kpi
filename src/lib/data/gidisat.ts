import { db } from "@/db";
import { gidisatMudurlukScores } from "@/db/schema";
import { eq } from "drizzle-orm";

function num(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type GidisatRanking = {
  mudurluk: string;
  sira: number | null;
  skor: number | null;
};

export async function listGidisatPeriods(): Promise<string[]> {
  const rows = await db.selectDistinct({ period: gidisatMudurlukScores.period }).from(gidisatMudurlukScores);
  return rows.map((r) => r.period).sort().reverse();
}

export async function getGidisatRanking(period: string): Promise<GidisatRanking[]> {
  const rows = await db
    .select()
    .from(gidisatMudurlukScores)
    .where(eq(gidisatMudurlukScores.period, period))
    .orderBy(gidisatMudurlukScores.sira);
  return rows.map((r) => ({ mudurluk: r.mudurluk, sira: r.sira, skor: num(r.skor) }));
}

export type GidisatDetail = {
  mudurluk: string;
  sira: number | null;
  skor: number | null;
  kpiValues: Record<string, number | null>;
};

export async function getGidisatDetail(
  mudurluk: string,
  period: string,
): Promise<GidisatDetail | null> {
  const rows = await db
    .select()
    .from(gidisatMudurlukScores)
    .where(eq(gidisatMudurlukScores.period, period));
  const row = rows.find((r) => r.mudurluk === mudurluk);
  if (!row) return null;
  return {
    mudurluk: row.mudurluk,
    sira: row.sira,
    skor: num(row.skor),
    kpiValues: row.kpiValues as Record<string, number | null>,
  };
}
