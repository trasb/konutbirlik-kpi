import * as XLSX from "xlsx";
import {
  FactRow,
  Level,
  ParseResult,
  fractionToPercent,
  normalizeMudurluk,
  toNumber,
  toText,
} from "./types";

/**
 * "Tip B" dosya ailesi: Müdürlük/Amirlik/Ekip blokları AYRI sayfalarda değil, TEK sayfada
 * yan yana (örn. T18, T8, T25, T33). Her blok kendi ID kolonlarıyla başlar (Müdürlük,
 * [Amirlik], [Ekip No]) ve hemen ardından (Pay, Toplam, Oran) üçlüsü gelir.
 *
 * Bloklar her zaman soldan sağa Müdürlük → Amirlik → Ekip sırasında durur (T25'te olduğu
 * gibi başlık satırları farklı satırlara dağılmış olsa bile). Bu yüzden "Müdürlük" başlık
 * hücrelerini ilk birkaç satırda arayıp SÜTUNA göre sıralıyoruz — hangi satırda olduğu
 * önemli değil, soldan sağa sıra blok sırasını veriyor.
 */
export type MultiBlockFamilySpec = {
  id: string;
  sheetName: string;
  kpiCode: string;
  /** Soldan sağa blok sırası; bir bloğu atlamak için "skip" kullan (örn. T33'ün "Aristo Hariç" bloğu). */
  blocks: (Level | "skip")[];
  /** true ise Oran kolonu 0-1 aralığında kesir olarak saklanıyor (örn. T18, T8) ve yüzdeye çevrilmeli. */
  oranIsFraction?: boolean;
  matchSignal?: { cellText: string };
};

const ID_HEADERS_MUDURLUK = ["Müdürlük", "Mudurluk", "Müdürlük Adı", "MÜDÜRLÜK", "TM"];

function findMudurlukHeaderCells(
  rows: unknown[][],
  scanRows: number,
): { row: number; col: number }[] {
  const found: { row: number; col: number }[] = [];
  for (let r = 0; r < Math.min(rows.length, scanRows); r++) {
    const row = rows[r];
    if (!row) continue;
    row.forEach((c, colIdx) => {
      if (ID_HEADERS_MUDURLUK.includes(toText(c) ?? "")) found.push({ row: r, col: colIdx });
    });
  }
  found.sort((a, b) => a.col - b.col);
  return found;
}

export function isMultiBlockWorkbook(workbook: XLSX.WorkBook, spec: MultiBlockFamilySpec): boolean {
  if (!workbook.SheetNames.includes(spec.sheetName)) return false;
  if (!spec.matchSignal) return true;

  const sheet = workbook.Sheets[spec.sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  return rows.slice(0, 6).some((row) => row?.some((c) => toText(c) === spec.matchSignal!.cellText));
}

export function parseMultiBlockWorkbook(
  workbook: XLSX.WorkBook,
  spec: MultiBlockFamilySpec,
  sourceFile: string,
  period: string,
): ParseResult {
  const warnings: string[] = [];
  const facts: FactRow[] = [];

  const sheet = workbook.Sheets[spec.sheetName];
  if (!sheet) {
    return { facts, nvsRows: [], warnings: [`Sayfa bulunamadı: "${spec.sheetName}"`] };
  }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });

  const positions = findMudurlukHeaderCells(rows, 6);
  if (positions.length < spec.blocks.length) {
    return {
      facts,
      nvsRows: [],
      warnings: [
        `[${spec.sheetName}] Beklenen ${spec.blocks.length} blok için yeterli "Müdürlük" başlığı bulunamadı (bulunan: ${positions.length})`,
      ],
    };
  }

  const dataStartRow = Math.max(...positions.slice(0, spec.blocks.length).map((p) => p.row)) + 1;

  const blockDefs = spec.blocks.map((level, i) => ({ level, startCol: positions[i].col }));

  for (let r = dataStartRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null)) continue;

    for (const { level, startCol } of blockDefs) {
      if (level === "skip") continue;

      const idCols = level === "mudurluk" ? 1 : level === "amirlik" ? 2 : 3;
      const mudurluk = normalizeMudurluk(row[startCol]);
      if (!mudurluk) continue;
      const amirlik = idCols >= 2 ? (toText(row[startCol + 1]) ?? "") : "";
      const ekipNo = idCols >= 3 ? (toText(row[startCol + 2]) ?? "") : "";

      const metricBase = startCol + idCols;
      const numerator = toNumber(row[metricBase]);
      const denominator = toNumber(row[metricBase + 1]);
      const oran = spec.oranIsFraction
        ? fractionToPercent(row[metricBase + 2])
        : toNumber(row[metricBase + 2]);
      if (numerator === null && denominator === null && oran === null) continue;

      facts.push({
        period,
        kpiCode: spec.kpiCode,
        level,
        mudurluk,
        amirlik,
        ekipNo,
        numerator,
        denominator,
        oran,
        sourceFile,
      });
    }
  }

  return { facts, nvsRows: [], warnings };
}
