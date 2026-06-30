export type Level = "mudurluk" | "amirlik" | "ekip";
export type NvsLevel = "bolge" | "mudurluk" | "amirlik" | "ekip";

// NOT: amirlik/ekipNo "uygulanmıyor" durumunda null DEĞİL, boş string ("") olarak set edilir.
// Postgres unique index'lerinde NULL hiçbir zaman bir başka NULL ile "eşit" sayılmaz, bu yüzden
// upsert (ON CONFLICT) NULL içeren satırlarda eşleşmeyip her yüklemede yeni satır açar. Boş string
// sentinel kullanmak, aynı (period, kpiCode, level, mudurluk, amirlik, ekipNo) kombinasyonunun
// güvenilir şekilde upsert edilmesini sağlar.
export type FactRow = {
  period: string; // 'YYYY-MM'
  kpiCode: string;
  level: Level;
  mudurluk: string;
  amirlik: string; // seviye 'mudurluk' ise ""
  ekipNo: string; // seviye 'mudurluk'|'amirlik' ise ""
  numerator: number | null;
  denominator: number | null;
  oran: number | null; // yüzde (0-100)
  sourceFile: string;
};

export type NvsComponent = {
  oran: number | null; // yüzde (0-100)
  skor: number | null;
};

// Aynı NULL/upsert nedeniyle mudurluk/amirlik/ekipNo burada da "uygulanmıyor" durumunda "" kullanır.
export type NvsRow = {
  period: string;
  level: NvsLevel;
  mudurluk: string; // seviye 'bolge' ise ""
  amirlik: string; // seviye 'bolge'|'mudurluk' ise ""
  ekipNo: string; // seviye 'bolge'|'mudurluk'|'amirlik' ise ""
  ekipFirmaTipi: string | null;
  toplamPuan: number | null;
  components: Record<string, NvsComponent>;
};

export type ParseResult = {
  facts: FactRow[];
  nvsRows: NvsRow[];
  warnings: string[];
};

/** Bir hücreyi sayıya çevirir; boş/metin ise null döner. */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Bir hücreyi metne çevirir; boş ise null döner. */
export function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/** NVS'deki 0-1 aralığındaki oranları yüzdeye çevirir (0.9234 -> 92.34). */
export function fractionToPercent(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  return n <= 1 ? n * 100 : n;
}
