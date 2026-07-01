import * as XLSX from "xlsx";
import { FactRow, ParseResult, normalizeMudurluk, toNumber, toText } from "./types";

// Sütun indeksi -> KPI kodu eşlemesi. "GidişaTT - Amirlik" dosyası sabit bir şablon.
//
// Excel'deki bazı KPI başlıkları 2 kolonluk merge (örn. T19: kol 18-19). Header satırında
// (satır 4 = Altın eşikleri) bu KPI'ların değeri merge'in ilk kolonunda (kol 18). Ama
// amirlik veri satırlarında oran değeri merge'in bir önceki kolona (kol 17) yazılmış.
// Bu nedenle `col` (oran verisi) ile `targetCol` (Altın eşiği satırı) farklı olabilir.
const COLUMN_MAP: { col: number; targetCol?: number; kpiCode: string }[] = [
  { col: 10, kpiCode: "T4_KURULUM_SURE_UYUM" },
  { col: 11, kpiCode: "T29_DONUSUM_SURE_UYUM" },
  { col: 12, kpiCode: "T70_SES_KURULUM_SURE_UYUM" },
  { col: 13, kpiCode: "T7_IPTV_KURULUM_SURE_UYUM" },
  { col: 14, kpiCode: "T71_SES_ARIZA_SURE_UYUM" },
  { col: 15, kpiCode: "T13_ARIZA_SURE_UYUM" },
  { col: 16, kpiCode: "T16_TV_ARIZA_SURE_UYUM" },
  { col: 17, targetCol: 18, kpiCode: "T19_ILK_RANDEVU_UYUM" },
  { col: 19, targetCol: 20, kpiCode: "T99_TV_RANDEVU_UYUM" },
  { col: 21, targetCol: 22, kpiCode: "T25_KURULUM_TAMAMLANMA" },
  { col: 23, targetCol: 24, kpiCode: "T8_DONUSUM_TAMAMLANMA" },
  { col: 25, targetCol: 26, kpiCode: "T27_IPTV_KURULUM_TAMAMLANMA" },
  { col: 28, kpiCode: "T33_TEKRAR_EDEN_ARIZA" },
  { col: 29, kpiCode: "T32_EV_ICI_TEKRAR" },
  { col: 30, kpiCode: "T34_IPTV_TEKRAR_ARIZA" },
  { col: 31, kpiCode: "T37_KRONIK_ARIZA" },
  { col: 32, targetCol: 33, kpiCode: "T36_ERKEN_ARIZA" },
  { col: 33, targetCol: 34, kpiCode: "T28_DONUSUM_ERKEN_ARIZA" },
  { col: 35, targetCol: 36, kpiCode: "T39_IPTV_ERKEN_ARIZA_YS" },
  { col: 37, targetCol: 38, kpiCode: "T95_DSL_MUSTERI_BASINA_ARIZA" },
  { col: 40, kpiCode: "T96_FTTH_MUSTERI_BASINA_ARIZA" },
];

const MUDURLUK_COL = 0;
const AMIRLIK_COL = 9;
const ALTIN_ROW_INDEX = 4; // satır5 (0-bazlı 4): "Altın" eşik satırı
const DATA_START_ROW = 7;

export type GoldTarget = { kpiCode: string; target: number };

export type GidisatAmirlikRow = {
  period: string;
  mudurluk: string;
  amirlik: string;
  kpiValues: Record<string, number>;
};

export type GidisatAmirlikParseResult = ParseResult & {
  goldTargets: GoldTarget[];
  amirlikRows: GidisatAmirlikRow[];
};

function sheetToRows(workbook: XLSX.WorkBook): unknown[][] {
  const sheet = workbook.Sheets["Amirlik"];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
}

export function isGidisatAmirlikWorkbook(workbook: XLSX.WorkBook): boolean {
  if (workbook.SheetNames.length !== 1 || workbook.SheetNames[0] !== "Amirlik") return false;
  const rows = sheetToRows(workbook);
  const row0 = rows[0];
  return (
    toText(row0?.[0]) === "MÜDÜRLÜK" &&
    rows.slice(0, 2).some((row) => row?.some((c) => toText(c) === "Kurulum Sürelerine Uyum Oranı"))
  );
}

/** "90-91-92-93" -> son eşik (skor5 = Altın hedefi) sayı olarak. */
function lastThreshold(value: unknown): number | null {
  const s = toText(value);
  if (!s) return null;
  const parts = s.trim().split("-");
  const last = parts[parts.length - 1];
  return toNumber(last.replace(",", "."));
}

export function parseGidisatAmirlikWorkbook(
  workbook: XLSX.WorkBook,
  sourceFile: string,
  period: string,
): GidisatAmirlikParseResult {
  const warnings: string[] = [];
  const facts: FactRow[] = [];
  const amirlikRows: GidisatAmirlikRow[] = [];
  const rows = sheetToRows(workbook);

  const altinRow = rows[ALTIN_ROW_INDEX] ?? [];
  // Altın eşikleri header pozisyonunda (targetCol) okunur; veri satırlarındaki oran ise col'da.
  const goldTargets: GoldTarget[] = COLUMN_MAP.map(({ col, targetCol, kpiCode }) => ({
    kpiCode,
    target: lastThreshold(altinRow[targetCol ?? col]),
  })).filter((g): g is GoldTarget => g.target !== null);

  for (let r = DATA_START_ROW; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null)) continue;

    const mudurlukRaw = toText(row[MUDURLUK_COL]);
    const amirlikRaw = toText(row[AMIRLIK_COL]);
    if (!mudurlukRaw || !amirlikRaw) continue;
    if (mudurlukRaw.toLocaleUpperCase("tr-TR").includes("BÖLGE")) continue;
    if (amirlikRaw.toLocaleUpperCase("tr-TR") === "AMİRLİK") continue; // bölge özet satırı işaretçisi

    const mudurluk = normalizeMudurluk(mudurlukRaw);
    const kpiValues: Record<string, number> = {};

    for (const { col, kpiCode } of COLUMN_MAP) {
      const oran = toNumber(row[col]);
      if (oran === null) continue;
      kpiValues[kpiCode] = oran;
      facts.push({
        period,
        kpiCode,
        level: "amirlik",
        mudurluk,
        amirlik: amirlikRaw,
        ekipNo: "",
        numerator: null,
        denominator: null,
        oran,
        sourceFile,
      });
    }

    if (Object.keys(kpiValues).length > 0) {
      amirlikRows.push({ period, mudurluk, amirlik: amirlikRaw, kpiValues });
    }
  }

  return { facts, nvsRows: [], warnings, goldTargets, amirlikRows };
}
