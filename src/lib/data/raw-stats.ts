import { db } from "@/db";
import { rawIsKayitlari } from "@/db/schema";
import { and, eq } from "drizzle-orm";

function num(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type RawStats = {
  toplam: number;
  uyumlu: number;
  uyumsuz: number;
  bilinmeyen: number; // uyumlu bilgisi olmayan kayıtlar
  uyumsuzOrtalamaSaat: number | null;
  uyumsuzMinSaat: number | null;
  uyumsuzMaxSaat: number | null;
  histogram: { label: string; count: number }[];
  ekipler: { ekipNo: string; toplam: number; uyumlu: number; uyumsuz: number; oran: number | null }[];
};

const HISTOGRAM_BINS = [
  { max: 24, label: "0-24 saat" },
  { max: 48, label: "24-48 saat" },
  { max: 96, label: "48-96 saat" },
  { max: 168, label: "96-168 saat" },
  { max: Infinity, label: "168+ saat" },
];

export async function getRawStats(kpiCode: string, period: string): Promise<RawStats | null> {
  const rows = await db
    .select()
    .from(rawIsKayitlari)
    .where(and(eq(rawIsKayitlari.kpiCode, kpiCode), eq(rawIsKayitlari.period, period)));

  if (rows.length === 0) return null;

  const uyumlu = rows.filter((r) => r.uyumlu === 1).length;
  const uyumsuz = rows.filter((r) => r.uyumlu === 0).length;
  const bilinmeyen = rows.length - uyumlu - uyumsuz;

  const uyumsuzSureler = rows
    .filter((r) => r.uyumlu === 0)
    .map((r) => num(r.sureSaat))
    .filter((s): s is number => s !== null);

  const uyumsuzOrtalamaSaat =
    uyumsuzSureler.length > 0
      ? uyumsuzSureler.reduce((a, b) => a + b, 0) / uyumsuzSureler.length
      : null;
  const uyumsuzMinSaat = uyumsuzSureler.length > 0 ? Math.min(...uyumsuzSureler) : null;
  const uyumsuzMaxSaat = uyumsuzSureler.length > 0 ? Math.max(...uyumsuzSureler) : null;

  const histogram = HISTOGRAM_BINS.map((bin, i) => {
    const min = i === 0 ? 0 : HISTOGRAM_BINS[i - 1].max;
    const count = uyumsuzSureler.filter((s) => s > min && s <= bin.max).length;
    return { label: bin.label, count };
  });

  const ekipMap = new Map<string, { toplam: number; uyumlu: number; uyumsuz: number }>();
  for (const r of rows) {
    if (!r.ekipNo) continue;
    const cur = ekipMap.get(r.ekipNo) ?? { toplam: 0, uyumlu: 0, uyumsuz: 0 };
    cur.toplam++;
    if (r.uyumlu === 1) cur.uyumlu++;
    if (r.uyumlu === 0) cur.uyumsuz++;
    ekipMap.set(r.ekipNo, cur);
  }
  const ekipler = [...ekipMap.entries()]
    .map(([ekipNo, v]) => ({
      ekipNo,
      ...v,
      oran: v.toplam > 0 ? (v.uyumlu / v.toplam) * 100 : null,
    }))
    .sort((a, b) => (b.oran ?? 0) - (a.oran ?? 0));

  return {
    toplam: rows.length,
    uyumlu,
    uyumsuz,
    bilinmeyen,
    uyumsuzOrtalamaSaat,
    uyumsuzMinSaat,
    uyumsuzMaxSaat,
    histogram,
    ekipler,
  };
}

export async function listRawStatsPeriods(kpiCode: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ period: rawIsKayitlari.period })
    .from(rawIsKayitlari)
    .where(eq(rawIsKayitlari.kpiCode, kpiCode));
  return rows.map((r) => r.period).sort().reverse();
}
