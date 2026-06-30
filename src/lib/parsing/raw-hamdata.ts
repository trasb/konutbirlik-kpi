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

export type RawHamdataSpec = {
  sheetName: string;
  kpiCode: string;
  /** "Evet" gibi bir metinle eşleşirse uyumlu=1, "Hayır" ile eşleşirse 0 sayılır. */
  uyumluHeaders: string[];
};

const HEADER_ALIASES = {
  mudurluk: ["Müdürlük Adı", "Müdürlük", "Mudurluk"],
  amirlik: ["Amirlik Adı", "Amirlik"],
  ekip: ["Ekip No", "Ekip"],
  kayitNo: ["Il-Müdürlük-Sıra No", "Hizmet No", "Adsl No"],
  isTuru: ["İş Türü Adı", "Alt İş Türü Adı"],
  sure: ["Tamamlanma Süresi (Saat)"],
  tamamlanmaTarihi: ["Tamamlanma Tarihi", "Isemri Tamamlanma Zamanı"],
};

function findColAny(headerRow: unknown[], names: string[]): number {
  for (const name of names) {
    const idx = headerRow.findIndex((c) => toText(c) === name);
    if (idx !== -1) return idx;
  }
  return -1;
}

function excelDateToISO(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  return null;
}

/** Belirtilen Hamdata sayfasını parse edip SADECE verilen amirliğe ait ham kayıtları döner. */
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

  const header = rows[0];
  const mudurlukCol = findColAny(header, HEADER_ALIASES.mudurluk);
  const amirlikCol = findColAny(header, HEADER_ALIASES.amirlik);
  const ekipCol = findColAny(header, HEADER_ALIASES.ekip);
  const kayitNoCol = findColAny(header, HEADER_ALIASES.kayitNo);
  const isTuruCol = findColAny(header, HEADER_ALIASES.isTuru);
  const sureCol = findColAny(header, HEADER_ALIASES.sure);
  const tarihCol = findColAny(header, HEADER_ALIASES.tamamlanmaTarihi);
  const uyumluCol = findColAny(header, spec.uyumluHeaders);

  if (amirlikCol === -1 || mudurlukCol === -1) {
    return { records: [], warnings: [`[${spec.sheetName}] Müdürlük/Amirlik kolonu bulunamadı`] };
  }

  const records: RawIsKaydi[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null)) continue;

    const amirlik = toText(row[amirlikCol]);
    if (amirlik !== amirlikFilter) continue; // sadece KONUTBİRLİK'i tut

    const mudurluk = normalizeMudurluk(row[mudurlukCol]);
    const ekipNo = ekipCol >= 0 ? (toText(row[ekipCol]) ?? "") : "";
    const kayitNo =
      kayitNoCol >= 0 ? (toText(row[kayitNoCol]) ?? `${spec.kpiCode}-${r}`) : `${spec.kpiCode}-${r}`;
    const isTuru = isTuruCol >= 0 ? toText(row[isTuruCol]) : null;
    const sureSaat = sureCol >= 0 ? toNumber(row[sureCol]) : null;
    const tamamlanmaTarihi = tarihCol >= 0 ? excelDateToISO(row[tarihCol]) : null;

    let uyumlu: 0 | 1 | null = null;
    if (uyumluCol >= 0) {
      const raw = toText(row[uyumluCol]);
      if (raw === "Evet") uyumlu = 1;
      else if (raw === "Hayır") uyumlu = 0;
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
