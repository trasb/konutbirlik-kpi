import * as XLSX from "xlsx";
import { FactRow, Level, ParseResult, toNumber, toText } from "./types";

export type MetricSpec = { kpiCode: string };

export type LevelSheetSpec = { sheetName: string; level: Level };

/**
 * "Tip A" dosya ailesi: Müdürlük/Amirlik/Ekip için AYRI sayfalar, her sayfada N adet
 * (Pay, Toplam, Oran) üçlüsü yan yana (N = metrics.length, sırayla). Kolon başlıkları
 * dosyalar arası tutarsız olabildiğinden (örn. T4_5_7_70'te "3 Günde Kurulan" vs
 * "5 Günde Kurulan" aynı bloğu farklı isimlendiriyor), metrik blokları İSİM değil
 * POZİSYON ile eşleştirilir: ID kolonlarından (ve varsa Dönem'den) hemen sonra, sırayla.
 */
export type SeparateSheetsFamilySpec = {
  id: string;
  metrics: MetricSpec[];
  sheets: LevelSheetSpec[];
  /** true ise her veri satırında ayrı bir "Dönem" kolonu var (örn. T39); yoksa dönem upload sırasında seçilir. */
  hasInlineDonem?: boolean;
  /**
   * Bazı dosya aileleri aynı jenerik sayfa adlarını kullanıyor (örn. T39 ve Teyitten ikisi de
   * "Müdürlük"/"Amirlik"/"Ekip" sayfalarına sahip). Bu durumda sayfa adı eşleşmesi tek başına
   * yetersiz kalıyor; belirtilen sayfada bu metnin bir hücrede aynen geçmesi de aranır.
   */
  matchSignal?: { sheetName: string; cellText: string };
};

const ID_HEADERS = {
  mudurluk: ["Müdürlük", "Mudurluk", "Müdürlük Adı", "MÜDÜRLÜK"],
  amirlik: ["Amirlik", "Amirlik Adı", "AMİRLİK"],
  ekip: ["Ekip No", "Ekip", "EKİP NO"],
  donem: ["Dönem"],
};

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i];
    if (!row) continue;
    if (row.some((c) => ID_HEADERS.mudurluk.includes(toText(c) ?? ""))) return i;
  }
  throw new Error("Başlık satırı bulunamadı (Müdürlük kolonu yok)");
}

function findColAny(headerRow: unknown[], names: string[]): number {
  for (const name of names) {
    const idx = headerRow.findIndex((c) => toText(c) === name);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function isSeparateSheetsWorkbook(
  workbook: XLSX.WorkBook,
  spec: SeparateSheetsFamilySpec,
): boolean {
  if (!spec.sheets.every((s) => workbook.SheetNames.includes(s.sheetName))) return false;

  if (spec.matchSignal) {
    const sheet = workbook.Sheets[spec.matchSignal.sheetName];
    if (!sheet) return false;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const found = rows
      .slice(0, 6)
      .some((row) => row?.some((c) => toText(c) === spec.matchSignal!.cellText));
    if (!found) return false;
  }

  return true;
}

export function parseSeparateSheetsWorkbook(
  workbook: XLSX.WorkBook,
  spec: SeparateSheetsFamilySpec,
  sourceFile: string,
  fallbackPeriod: string | null,
): ParseResult {
  const warnings: string[] = [];
  const facts: FactRow[] = [];

  for (const { sheetName, level } of spec.sheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      warnings.push(`Sayfa bulunamadı: "${sheetName}"`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    if (rows.length === 0) continue;

    let headerIdx: number;
    try {
      headerIdx = findHeaderRowIndex(rows);
    } catch (e) {
      warnings.push(`[${sheetName}] ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const header = rows[headerIdx];

    const mudurlukCol = findColAny(header, ID_HEADERS.mudurluk);
    const amirlikCol = level !== "mudurluk" ? findColAny(header, ID_HEADERS.amirlik) : -1;
    const ekipCol = level === "ekip" ? findColAny(header, ID_HEADERS.ekip) : -1;
    const donemCol = spec.hasInlineDonem ? findColAny(header, ID_HEADERS.donem) : -1;

    if (mudurlukCol === -1) {
      warnings.push(`[${sheetName}] Müdürlük kolonu bulunamadı`);
      continue;
    }
    if (level !== "mudurluk" && amirlikCol === -1) {
      warnings.push(`[${sheetName}] Amirlik kolonu bulunamadı`);
      continue;
    }
    if (level === "ekip" && ekipCol === -1) {
      warnings.push(`[${sheetName}] Ekip No kolonu bulunamadı`);
      continue;
    }

    const idCols = [mudurlukCol, amirlikCol, ekipCol, donemCol].filter((c) => c >= 0);
    const dataStartCol = Math.max(...idCols) + 1;

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => c === null)) continue;

      const mudurluk = toText(row[mudurlukCol]);
      if (!mudurluk) continue;
      const amirlik = amirlikCol >= 0 ? (toText(row[amirlikCol]) ?? "") : "";
      const ekipNo = ekipCol >= 0 ? (toText(row[ekipCol]) ?? "") : "";

      let period: string | null = fallbackPeriod;
      if (spec.hasInlineDonem && donemCol >= 0) {
        const donemRaw = toText(row[donemCol]);
        period =
          donemRaw && donemRaw.length === 6 && /^\d{6}$/.test(donemRaw)
            ? `${donemRaw.slice(0, 4)}-${donemRaw.slice(4, 6)}`
            : null;
      }
      if (!period) {
        warnings.push(`[${sheetName}] satır ${r + 1}: dönem belirlenemedi, atlandı.`);
        continue;
      }

      spec.metrics.forEach((metric, i) => {
        const base = dataStartCol + i * 3;
        const numerator = toNumber(row[base]);
        const denominator = toNumber(row[base + 1]);
        const oran = toNumber(row[base + 2]);
        if (numerator === null && denominator === null && oran === null) return;

        facts.push({
          period: period as string,
          kpiCode: metric.kpiCode,
          level,
          mudurluk,
          amirlik,
          ekipNo,
          numerator,
          denominator,
          oran,
          sourceFile,
        });
      });
    }
  }

  return { facts, nvsRows: [], warnings };
}
