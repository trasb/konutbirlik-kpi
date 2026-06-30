import * as XLSX from "xlsx";
import {
  FactRow,
  NvsRow,
  NvsComponent,
  NvsLevel,
  ParseResult,
  fractionToPercent,
  toNumber,
  toText,
} from "./types";

// NVS Özet sayfalarındaki 10 bileşen. Bölge/Müdürlük/Amirlik Özet'te ve Ekip Özet'te
// başlık metinleri farklı (Ekip Özet "Elitt Çözüm" der, diğerleri "Ev İçi Destek" der),
// bu yüzden her isim varyantını eşleştiriyoruz.
const COMPONENT_HEADER_ALIASES: { kpiCode: string; headers: string[] }[] = [
  { kpiCode: "T13_ARIZA_SURE_UYUM", headers: ["Arıza Süre Uyum Oran", "Arıza Sürelerine Uyum Oranı"] },
  { kpiCode: "T41_43_PORT_TESTI", headers: ["Başarılı Port Testi Oran", "Başarılı Port Testi Oranı"] },
  { kpiCode: "T32_EV_ICI_DESTEK", headers: ["Ev İçi Destek Oranı", "Elitt Çözüm Oranı"] },
  { kpiCode: "T32_EV_ICI_TEKRAR", headers: ["Ev İçi Destek Tekrar Oran", "Elitt Tekrar Eden Oran"] },
  { kpiCode: "T36_ERKEN_ARIZA", headers: ["Erken Arıza Oran", "Erken Arıza Oranı"] },
  { kpiCode: "IS_HACMI", headers: ["İş Hacmi Oran", "İş Hacmi Oranı"] },
  { kpiCode: "T4_KURULUM_SURE_UYUM", headers: ["Kurulum Süre Uyum Oran", "Kurulum Sürelerine Uyum Oranı"] },
  { kpiCode: "T25_KURULUM_TAMAMLANMA", headers: ["Kurulum Tamamlanma Oran", "Kurulum Tamamlanma Oranı"] },
  { kpiCode: "TEYITTEN_DONME", headers: ["Teyitten Dönme Oran", "Teyitten Dönme Oranı"] },
  { kpiCode: "T33_TEKRAR_EDEN_ARIZA", headers: ["Tekrar Eden Arıza Oran", "Tekrar Eden Arıza Oranı"] },
];

function donemToPeriod(donem: unknown): string | null {
  const s = toText(donem);
  if (!s || s.length !== 6 || !/^\d{6}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}`;
}

function sheetToRows(workbook: XLSX.WorkBook, sheetName: string): unknown[][] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
}

/** Başlık satırındaki metne göre kolon index'i bulur (sheet'in başlangıç sütunundan bağımsız). */
function findCol(headerRow: unknown[], name: string): number {
  const idx = headerRow.findIndex((c) => toText(c) === name);
  if (idx === -1) throw new Error(`Kolon bulunamadı: "${name}"`);
  return idx;
}

function findColAny(headerRow: unknown[], names: string[]): number {
  for (const name of names) {
    const idx = headerRow.findIndex((c) => toText(c) === name);
    if (idx !== -1) return idx;
  }
  throw new Error(`Kolonlardan hiçbiri bulunamadı: ${names.join(", ")}`);
}

/** Bölge/Müdürlük/Amirlik Özet sayfaları: Oran+Skor çiftleri var, Pay/Payda yok. */
function parseScoreOnlySheet(
  rows: unknown[][],
  level: NvsLevel,
  sheetLabel: string,
): { nvsRows: NvsRow[]; warnings: string[] } {
  const nvsRows: NvsRow[] = [];
  const warnings: string[] = [];
  if (rows.length < 2) return { nvsRows, warnings };

  const header = rows[1];
  const donemCol = findCol(header, "Dönem");
  const toplamPuanCol = findCol(header, "Toplam Puan");
  const mudurlukCol = header.some((c) => toText(c) === "Müdürlük") ? findCol(header, "Müdürlük") : -1;
  const amirlikCol = header.some((c) => toText(c) === "Amirlik") ? findCol(header, "Amirlik") : -1;

  const componentCols = COMPONENT_HEADER_ALIASES.map((c) => ({
    kpiCode: c.kpiCode,
    oranCol: findColAny(header, c.headers),
  }));

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null)) continue;

    const period = donemToPeriod(row[donemCol]);
    if (!period) {
      warnings.push(`[${sheetLabel}] satır ${r + 1}: geçerli Dönem yok, atlandı.`);
      continue;
    }

    const components: Record<string, NvsComponent> = {};
    for (const { kpiCode, oranCol } of componentCols) {
      const skorCol = oranCol + 1;
      components[kpiCode] = {
        oran: fractionToPercent(row[oranCol]),
        skor: toNumber(row[skorCol]),
      };
    }

    nvsRows.push({
      period,
      level,
      mudurluk: mudurlukCol >= 0 ? (toText(row[mudurlukCol]) ?? "") : "",
      amirlik: amirlikCol >= 0 ? (toText(row[amirlikCol]) ?? "") : "",
      ekipNo: "",
      ekipFirmaTipi: null,
      toplamPuan: toNumber(row[toplamPuanCol]),
      components,
    });
  }

  return { nvsRows, warnings };
}

function parseEkipOzet(
  rows: unknown[][],
  sourceFile: string,
): { nvsRows: NvsRow[]; facts: FactRow[]; warnings: string[] } {
  const nvsRows: NvsRow[] = [];
  const facts: FactRow[] = [];
  const warnings: string[] = [];
  if (rows.length < 2) return { nvsRows, facts, warnings };

  const header = rows[1];
  const donemCol = findCol(header, "Dönem");
  const mudurlukCol = findCol(header, "Müdürlük");
  const amirlikCol = findCol(header, "Amirlik");
  const ekipNoCol = findCol(header, "Ekip No");
  const ekipFirmaCol = findCol(header, "Ekip Firma Ekibi");
  const toplamPuanCol = findCol(header, "Toplam Puan");

  const componentCols = COMPONENT_HEADER_ALIASES.map((c) => {
    const oranCol = findColAny(header, c.headers);
    // Pay kolonu başlığı "<Oran Başlığı> Pay" şeklinde; bazı varyantlarda "Oranı"/"Oran" ekleri tutarsız
    // olduğundan, Oran kolonundan sonraki ilk "...Pay" / "...Payda" başlıklı kolonları sırayla ararız.
    return { kpiCode: c.kpiCode, oranCol };
  });

  // Pay/Payda blokları "<isim> Pay" / "<isim> Payda" başlığıyla, Oran+Skor bloğunun hemen sonrasında,
  // component sırasıyla aynı sırada tekrar eder. Bu yüzden "Pay" ile biten kolonları sırayla eşleştiriyoruz.
  const payCols = header
    .map((h, i) => ({ h: toText(h), i }))
    .filter((x) => x.h && /Pay$/.test(x.h))
    .map((x) => x.i);

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c === null)) continue;

    const period = donemToPeriod(row[donemCol]);
    if (!period) {
      warnings.push(`[ekip] satır ${r + 1}: geçerli Dönem yok, atlandı.`);
      continue;
    }

    const mudurluk = toText(row[mudurlukCol]);
    const amirlik = toText(row[amirlikCol]);
    const ekipNo = toText(row[ekipNoCol]);
    if (!mudurluk || !ekipNo) {
      warnings.push(`[ekip] satır ${r + 1}: Müdürlük/Ekip No eksik, atlandı.`);
      continue;
    }

    const components: Record<string, NvsComponent> = {};
    componentCols.forEach(({ kpiCode, oranCol }, i) => {
      const skorCol = oranCol + 1;
      const oran = fractionToPercent(row[oranCol]);
      const skor = toNumber(row[skorCol]);
      components[kpiCode] = { oran, skor };

      const payCol = payCols[i];
      const numerator = payCol !== undefined ? toNumber(row[payCol]) : null;
      const denominator = payCol !== undefined ? toNumber(row[payCol + 1]) : null;

      facts.push({
        period,
        kpiCode,
        level: "ekip",
        mudurluk,
        amirlik: amirlik ?? "",
        ekipNo,
        numerator,
        denominator,
        oran,
        sourceFile,
      });
    });

    nvsRows.push({
      period,
      level: "ekip",
      mudurluk,
      amirlik: amirlik ?? "",
      ekipNo,
      ekipFirmaTipi: toText(row[ekipFirmaCol]),
      toplamPuan: toNumber(row[toplamPuanCol]),
      components,
    });
  }

  return { nvsRows, facts, warnings };
}

export function isNvsWorkbook(workbook: XLSX.WorkBook): boolean {
  const names = workbook.SheetNames;
  return ["Bölge Özet", "Müdürlük Özet", "Amirlik Özet", "Ekip Özet"].every((n) =>
    names.includes(n),
  );
}

export function parseNvsWorkbook(workbook: XLSX.WorkBook, sourceFile: string): ParseResult {
  const warnings: string[] = [];
  const facts: FactRow[] = [];
  const nvsRows: NvsRow[] = [];

  const bolgeRows = sheetToRows(workbook, "Bölge Özet");
  const { nvsRows: bolgeNvs, warnings: w1 } = parseScoreOnlySheet(bolgeRows, "bolge", "Bölge Özet");
  nvsRows.push(...bolgeNvs);
  warnings.push(...w1);

  const mudurlukRows = sheetToRows(workbook, "Müdürlük Özet");
  const { nvsRows: mudurlukNvs, warnings: w2 } = parseScoreOnlySheet(
    mudurlukRows,
    "mudurluk",
    "Müdürlük Özet",
  );
  nvsRows.push(...mudurlukNvs);
  warnings.push(...w2);

  // Müdürlük seviyesinde de fact üretelim ki /kpi/[code] trend grafiğinde müdürlük kıyaslaması yapılabilsin.
  for (const row of mudurlukNvs) {
    if (!row.mudurluk) continue;
    for (const kpiCode of Object.keys(row.components)) {
      const comp = row.components[kpiCode];
      facts.push({
        period: row.period,
        kpiCode,
        level: "mudurluk",
        mudurluk: row.mudurluk,
        amirlik: "",
        ekipNo: "",
        numerator: null,
        denominator: null,
        oran: comp.oran,
        sourceFile,
      });
    }
  }

  const amirlikRows = sheetToRows(workbook, "Amirlik Özet");
  const { nvsRows: amirlikNvs, warnings: w3 } = parseScoreOnlySheet(
    amirlikRows,
    "amirlik",
    "Amirlik Özet",
  );
  nvsRows.push(...amirlikNvs);
  warnings.push(...w3);

  for (const row of amirlikNvs) {
    if (!row.mudurluk || !row.amirlik) continue;
    for (const kpiCode of Object.keys(row.components)) {
      const comp = row.components[kpiCode];
      facts.push({
        period: row.period,
        kpiCode,
        level: "amirlik",
        mudurluk: row.mudurluk,
        amirlik: row.amirlik,
        ekipNo: "",
        numerator: null,
        denominator: null,
        oran: comp.oran,
        sourceFile,
      });
    }
  }

  const ekipRows = sheetToRows(workbook, "Ekip Özet");
  const { nvsRows: ekipNvs, facts: ekipFacts, warnings: w4 } = parseEkipOzet(ekipRows, sourceFile);
  nvsRows.push(...ekipNvs);
  facts.push(...ekipFacts);
  warnings.push(...w4);

  return { facts, nvsRows, warnings };
}
