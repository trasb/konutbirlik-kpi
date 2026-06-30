import * as XLSX from "xlsx";
import { normalizeMudurluk, toNumber, toText } from "./types";

export type GidisatRow = {
  period: string;
  mudurluk: string;
  sira: number | null;
  skor: number | null;
  kpiValues: Record<string, number | null>;
};

export type GidisatParseResult = {
  rows: GidisatRow[];
  warnings: string[];
};

function sheetToRows(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
}

export function isGidisatWorkbook(workbook: XLSX.WorkBook): boolean {
  return (
    workbook.SheetNames.includes("Mail Gövdesi") &&
    workbook.SheetNames.includes("Hamdata") &&
    XLSX.utils
      .sheet_to_json<unknown[]>(workbook.Sheets["Mail Gövdesi"], { header: 1, defval: null })
      .slice(0, 2)
      .some((row) => row?.some((c) => toText(c) === "SIRA"))
  );
}

/** Hamdata'nın iki başlık satırını ("Kurulum Sürelerine Uyum Oranı" + "İnternet (T4)") birleştirip kolon adı üretir. */
function buildHamdataHeaders(row0: unknown[], row1: unknown[]): string[] {
  const width = Math.max(row0.length, row1.length);
  const headers: string[] = [];
  for (let i = 0; i < width; i++) {
    const a = toText(row0[i]);
    const b = toText(row1[i]);
    headers.push([a, b].filter(Boolean).join(" — "));
  }
  return headers;
}

export function parseGidisatWorkbook(workbook: XLSX.WorkBook, period: string): GidisatParseResult {
  const warnings: string[] = [];

  // 1) Sıralama/Skor — "Mail Gövdesi" sayfası: ['MÜDÜRLÜK ADI', 'SIRA', '***SKOR***']
  const rankRows = sheetToRows(workbook, "Mail Gövdesi");
  const rankByMudurluk = new Map<string, { sira: number | null; skor: number | null }>();
  for (let r = 1; r < rankRows.length; r++) {
    const row = rankRows[r];
    if (!row || row.every((c) => c === null)) continue;
    const mudurlukRaw = toText(row[0]);
    if (!mudurlukRaw) continue;
    // "BÖLGE" satırı bölge ortalamasıdır, bir müdürlük değildir — ayrı tutuyoruz.
    if (mudurlukRaw.toLocaleUpperCase("tr-TR") === "BÖLGE") continue;
    const mudurluk = normalizeMudurluk(mudurlukRaw);
    rankByMudurluk.set(mudurluk, { sira: toNumber(row[1]), skor: toNumber(row[2]) });
  }

  // 2) Ham KPI değerleri — "Hamdata" sayfası: 2 satırlık başlık + müdürlük bazlı veri.
  const hamRows = sheetToRows(workbook, "Hamdata");
  const kpiValuesByMudurluk = new Map<string, Record<string, number | null>>();
  if (hamRows.length >= 3) {
    const headers = buildHamdataHeaders(hamRows[0] ?? [], hamRows[1] ?? []);
    for (let r = 2; r < hamRows.length; r++) {
      const row = hamRows[r];
      if (!row || row.every((c) => c === null)) continue;
      const mudurlukRaw = toText(row[0]);
      if (!mudurlukRaw) continue;
      if (mudurlukRaw.toLocaleUpperCase("tr-TR").includes("BÖLGE")) continue;
      const mudurluk = normalizeMudurluk(mudurlukRaw);
      const values: Record<string, number | null> = {};
      for (let c = 1; c < headers.length; c++) {
        if (!headers[c]) continue;
        values[headers[c]] = toNumber(row[c]);
      }
      kpiValuesByMudurluk.set(mudurluk, values);
    }
  } else {
    warnings.push('"Hamdata" sayfası beklenen yapıda değil, KPI değerleri eklenmedi.');
  }

  const allMudurlukler = new Set([...rankByMudurluk.keys(), ...kpiValuesByMudurluk.keys()]);
  const rows: GidisatRow[] = [...allMudurlukler].map((mudurluk) => ({
    period,
    mudurluk,
    sira: rankByMudurluk.get(mudurluk)?.sira ?? null,
    skor: rankByMudurluk.get(mudurluk)?.skor ?? null,
    kpiValues: kpiValuesByMudurluk.get(mudurluk) ?? {},
  }));

  return { rows, warnings };
}
