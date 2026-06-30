import { db } from "@/db";
import { gidisatAmirlikScores } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function listGidisatAmirlikPeriods(): Promise<string[]> {
  const rows = await db.selectDistinct({ period: gidisatAmirlikScores.period }).from(gidisatAmirlikScores);
  return rows.map((r) => r.period).sort().reverse();
}

export type GidisatAmirlikDetail = {
  mudurluk: string;
  amirlik: string;
  kpiValues: Record<string, number>;
};

export async function getGidisatAmirlikDetail(
  mudurluk: string,
  amirlik: string,
  period: string,
): Promise<GidisatAmirlikDetail | null> {
  const rows = await db
    .select()
    .from(gidisatAmirlikScores)
    .where(
      and(
        eq(gidisatAmirlikScores.period, period),
        eq(gidisatAmirlikScores.mudurluk, mudurluk),
        eq(gidisatAmirlikScores.amirlik, amirlik),
      ),
    );
  const row = rows[0];
  if (!row) return null;
  return {
    mudurluk: row.mudurluk,
    amirlik: row.amirlik,
    kpiValues: row.kpiValues as Record<string, number>,
  };
}
