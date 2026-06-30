import * as XLSX from "xlsx";
import { normalizeMudurluk, toNumber, toText } from "./types";

export type RawIsKaydi = {
  period: string;
  kpiCode: string;
  mudurluk: string;
  amirlik: string;
  ekipNo: string;
  kayitNo: string;
  isTuru: string | null;
  sureSaat: number | null;
  uyumlu: 0 | 1 | null;
  tamamlanmaTarihi: string | null; // ISO string
  sourceFile: string;
};

/**
 * Kaynak Hamdata sayfaları çok farklı şekillerde "bu iş süresinde/başarılı mıydı" bilgisini
 * taşıyor. Her biri için en uygun modu seçiyoruz:
 *  - directDuration: süre kolonu saat cinsinden hazır; ayrıca Evet/Hayır gibi bir uyum
 *    kolonu varsa onu kullanır, yoksa esikSaat ile süreden türetir.
 *  - dateDiff: iki tarih kolonunun farkından süre (saat) hesaplanır; esikSaat verilmişse
 *    uyum da türetilir, verilmemişse sadece süre kaydedilir (uyum bilinmiyor sayılır).
 *  - successText: bir durum/metin kolonu başarı kümesindeyse uyumlu=1.
 *  - numericThreshold: sayısal bir kolon eşiği geçiyorsa (gte) ya da altındaysa (lte) uyumlu=1.
 *  - nullMeansSuccess: bir tarih/değer kolonu BOŞSA uyumlu=1 (örn. "İlk Arıza Zamanı" boşsa
 *    erken arıza yok demektir).
 */
export type RawHamdataSpec = {
  sheetName: string;
  kpiCode: string;
} & (
  | { mode: "directDuration"; sureHeaders: string[]; uyumluHeaders?: string[]; esikSaat?: number }
  | { mode: "dateDiff"; startHeaders: string[]; endHeaders: string[]; esikSaat?: number }
  | { mode: "successText"; valueHeaders: string[]; successValues: string[] }
  | { mode: "numericThreshold"; valueHeaders: string[]; threshold: number; comparison: "gte" | "lte" }
  | { mode: "nullMeansSuccess"; valueHeaders: string[] }
);

const HEADER_ALIASES = {
  mudurluk: ["Müdürlük Adı", "Müdürlük", "Mudurluk", "TM"],
  amirlik: ["Amirlik Adı", "Amirlik", "Islah Eden Ekip Amirlik"],
  ekip: ["Ekip No", "Ekip", "Islah Eden Ekip No"],
  kayitNo: [
    "Il-Müdürlük-Sıra No",
    "Hizmet Talebi Id",
    "Isemri ID",
    "Ariza Id",
    "Trans Id",
    "Hizmet No",
    "Adsl No",
  ],
  isTuru: ["İş Türü Adı", "Alt İş Türü Adı", "Is Turu", "Isemri Tipi Adı"],
  tamamlanmaTarihi: [
    "Tamamlanma Tarihi",
    "Isemri Tamamlanma Zamanı",
    "Kapama Zamanı",
    "İşemri Tamamlanma Tarihi (DD.MM.YYYY HH:MM:SS)",
    "İlk Arıza Zamanı", // T36/T28: erken arıza olayının kendi tarihi (30 günlük pencere projeksiyonu için)
  ],
};

function findColAny(headerRow: unknown[], names: string[]): number {
  for (const name of names) {
    const idx = headerRow.findIndex((c) => toText(c) === name);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Başlık her zaman ilk satırda olmuyor (örn. T7 sayfasında boş bir satır önce geliyor). */
function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i];
    if (!row) continue;
    if (findColAny(row, HEADER_ALIASES.amirlik) !== -1 && findColAny(row, HEADER_ALIASES.mudurluk) !== -1) {
      return i;
    }
  }
  return 0;
}

// XLSX.read'e cellDates:true verilse de bazı hücreler (özellikle metin biçimli tarihler)
// JS Date olarak değil ham Excel seri numarası (1900 epoch'undan gün sayısı) olarak gelebiliyor.
// İkisini de destekliyoruz.
function excelDateToMs(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number" && value > 25000 && value < 80000) {
    return Math.round((value - 25569) * 86_400_000);
  }
  return null;
}

function excelDateToISO(value: unknown): string | null {
  const ms = excelDateToMs(value);
  return ms === null ? null : new Date(ms).toISOString();
}

/** "Evet"/"Hayır", "Uyumlu"/"Uyumsuz", "true"/"false", 1/0 gibi farklı bayrak biçimlerini 1/0'a indirger. */
function parseFlag(value: unknown): 0 | 1 | null {
  const t = toText(value);
  if (t === null) {
    const n = toNumber(value);
    if (n === 1) return 1;
    if (n === 0) return 0;
    return null;
  }
  const low = t.toLocaleLowerCase("tr-TR");
  if (["evet", "true", "1", "uyumlu"].includes(low)) return 1;
  if (["hayır", "hayir", "false", "0", "uyumsuz"].includes(low)) return 0;
  return null;
}

export function parseRawHamdata(
  workbook: XLSX.WorkBook,
  spec: RawHamdataSpec,
  sourceFile: string,
  period: string,
  amirlikFilter: string,
): { records: RawIsKaydi[]; warnings: string[] } {
  const warnings: string[] = [];
  const sheet = workbook.Sheets[spec.sheetName];
  if (!sheet) return { records: [], warnings: [`Sayfa bulunamadı: "${spec.sheetName}"`] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  if (rows.length === 0) return { records: [], warnings: [] };

  const headerIdx = findHeaderRowIndex(rows);
  const header = rows[headerIdx];
  const mudurlukCol = findColAny(header, HEADER_ALIASES.mudurluk);
  const amirlikCol = findColAny(header, HEADER_ALIASES.amirlik);
  const ekipCol = findColAny(header, HEADER_ALIASES.ekip);
  const kayitNoCol = findColAny(header, HEADER_ALIASES.kayitNo);
  const isTuruCol = findColAny(header, HEADER_ALIASES.isTuru);
  const tarihCol = findColAny(header, HEADER_ALIASES.tamamlanmaTarihi);

  if (amirlikCol === -1 || mudurlukCol === -1) {
    return { records: [], warnings: [`[${spec.sheetName}] Müdürlük/Amirlik kolonu bulunamadı`] };
  }

  // Moda özgü kolonlar
  let sureCol = -1;
  let uyumluCol = -1;
  let startCol = -1;
  let endCol = -1;
  let valueCol = -1;

  if (spec.mode === "directDuration") {
    sureCol = findColAny(header, spec.sureHeaders);
    if (spec.uyumluHeaders) uyumluCol = findColAny(header, spec.uyumluHeaders);
  } else if (spec.mode === "dateDiff") {
    startCol = findColAny(header, spec.startHeaders);
    endCol = findColAny(header, spec.endHeaders);
  } else if (spec.mode === "successText" || spec.mode === "numericThreshold" || spec.mode === "nullMeansSuccess") {
    valueCol = findColAny(header, spec.valueHeaders);
  }

  const records: RawIsKaydi[] = [];
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null)) continue;

    const amirlik = toText(row[amirlikCol]);
    if (amirlik !== amirlikFilter) continue;

    const mudurluk = normalizeMudurluk(row[mudurlukCol]);
    const ekipNo = ekipCol >= 0 ? (toText(row[ekipCol]) ?? "") : "";
    const kayitNo =
      kayitNoCol >= 0 ? (toText(row[kayitNoCol]) ?? `${spec.kpiCode}-${r}`) : `${spec.kpiCode}-${r}`;
    const isTuru = isTuruCol >= 0 ? toText(row[isTuruCol]) : null;
    const tamamlanmaTarihi = tarihCol >= 0 ? excelDateToISO(row[tarihCol]) : null;

    let sureSaat: number | null = null;
    let uyumlu: 0 | 1 | null = null;

    if (spec.mode === "directDuration") {
      sureSaat = sureCol >= 0 ? toNumber(row[sureCol]) : null;
      if (uyumluCol >= 0) uyumlu = parseFlag(row[uyumluCol]);
      else if (sureSaat !== null && spec.esikSaat !== undefined) uyumlu = sureSaat <= spec.esikSaat ? 1 : 0;
    } else if (spec.mode === "dateDiff") {
      const startMs = startCol >= 0 ? excelDateToMs(row[startCol]) : null;
      const endMs = endCol >= 0 ? excelDateToMs(row[endCol]) : null;
      if (startMs !== null && endMs !== null) {
        sureSaat = (endMs - startMs) / 3_600_000;
        if (spec.esikSaat !== undefined) uyumlu = sureSaat <= spec.esikSaat ? 1 : 0;
      }
    } else if (spec.mode === "successText") {
      const v = toText(row[valueCol]);
      if (v !== null) uyumlu = spec.successValues.includes(v) ? 1 : 0;
    } else if (spec.mode === "numericThreshold") {
      const v = valueCol >= 0 ? toNumber(row[valueCol]) : null;
      if (v !== null) {
        uyumlu = spec.comparison === "gte" ? (v >= spec.threshold ? 1 : 0) : v <= spec.threshold ? 1 : 0;
      }
    } else if (spec.mode === "nullMeansSuccess") {
      const v = row[valueCol];
      uyumlu = v === null || v === undefined || v === "" ? 1 : 0;
    }

    records.push({
      period,
      kpiCode: spec.kpiCode,
      mudurluk,
      amirlik,
      ekipNo,
      kayitNo,
      isTuru,
      sureSaat,
      uyumlu,
      tamamlanmaTarihi,
      sourceFile,
    });
  }

  return { records, warnings };
}
