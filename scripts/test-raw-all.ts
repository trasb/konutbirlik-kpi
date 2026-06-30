import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { parseRawHamdata } from "../src/lib/parsing/raw-hamdata";
import { RAW_HAMDATA_BY_FAMILY } from "../src/lib/parsing/family-specs";

const DIR = "/Users/asuheylb/Downloads/Veriler-06-26/";
const AMIRLIK = "KONUTBİRLİK SAHA AMİRLİĞİ";
const PERIOD = "2026-06";

const FILES: Record<string, string> = {
  T4_5_7_70: "T4_5_7_70 Kurulum S&uuml_relerine Uyum Oranları Hamdata.xlsx",
  INTERNET_ARIZA_RANDEVU: "İnternet Arıza Randevuya Uyum Oranı Hamdata.xlsx",
  T19_99: "T19_99 Randevuya Uyum Oranları Hamdata.xlsx",
  T27_30: "T27_30 Kurulum Tamamlanma Oranları Hamdata.xlsx",
  T34: "T34 IPTV Tekrar Eden Arıza Oranı Hamdata (3).xlsx",
  T37_38: "T37_38 Kronik Arıza Oranları Hamdata (3).xlsx",
  TEYITTEN_DONEN: "Teyitten D&ouml_nen Arıza Oranı (3).xlsx",
  T41_43: "T41_43 Port Testi Başarılı Yapılma Oranları Hamdata.xlsx",
  T25_STANDALONE: "T25 İnternet Kurulum Tamamlanma Oranı Hamdata  (2).xlsx",
  T33_STANDALONE: "T33 İnternet Tekrar Eden Arıza Oranı Hamdata (5).xlsx",
  T8: "T8 - Başarılı D&ouml_n&uuml_ş&uuml_m Oranı - İnternet.xlsx",
  T18: "T18 Başarılı Elitt Oranı (1).xlsx",
};

for (const [familyId, fname] of Object.entries(FILES)) {
  const specs = RAW_HAMDATA_BY_FAMILY[familyId];
  if (!specs) {
    console.log(familyId, "ATLANDI - spec yok");
    continue;
  }
  const buf = readFileSync(DIR + fname);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

  for (const spec of specs) {
    const { records, warnings } = parseRawHamdata(wb, spec, fname, PERIOD, AMIRLIK);
    const uyumlu = records.filter((r) => r.uyumlu === 1).length;
    const uyumsuz = records.filter((r) => r.uyumlu === 0).length;
    const bilinmeyen = records.length - uyumlu - uyumsuz;
    console.log(
      `${familyId} [${spec.sheetName}] (${spec.kpiCode}): ${records.length} kayıt, uyumlu=${uyumlu} uyumsuz=${uyumsuz} bilinmeyen=${bilinmeyen}`,
      warnings.length ? `UYARI: ${warnings.join(" | ")}` : "",
    );
    if (records.length > 0) {
      console.log("   örnek:", JSON.stringify(records[0]));
    }
  }
}

// T32 ve T36/T28 manuel test
import { existsSync } from "fs";
const t32path = DIR + "T32 - Ev İ&ccedil_i Destek Arıza Tekrar Oranı - İnternet.xlsx";
if (existsSync(t32path)) {
  const wb = XLSX.read(readFileSync(t32path), { type: "buffer", cellDates: true });
  const { records } = parseRawHamdata(
    wb,
    {
      sheetName: "Ham Data",
      kpiCode: "T32_EV_ICI_TEKRAR",
      mode: "numericThreshold",
      valueHeaders: ["Tekrar Eden Arıza 7 Gün (Elitt Tekrar Eden)"],
      threshold: 0,
      comparison: "lte",
    },
    "T32.xlsx",
    PERIOD,
    AMIRLIK,
  );
  const uyumlu = records.filter((r) => r.uyumlu === 1).length;
  console.log(`T32_RAW: ${records.length} kayıt, uyumlu=${uyumlu}`);
}

const t3628path = DIR + "T36-T28 Erken Arıza Oranları Hamdata (2).xlsx";
if (existsSync(t3628path)) {
  const wb = XLSX.read(readFileSync(t3628path), { type: "buffer", cellDates: true });
  const { records } = parseRawHamdata(
    wb,
    {
      sheetName: "Hamveri",
      kpiCode: "T36_ERKEN_ARIZA",
      mode: "nullMeansSuccess",
      valueHeaders: ["İlk Arıza Zamanı"],
    },
    "T36_28.xlsx",
    PERIOD,
    AMIRLIK,
  );
  const uyumlu = records.filter((r) => r.uyumlu === 1).length;
  console.log(`T36_28_RAW: ${records.length} kayıt, uyumlu=${uyumlu}`);
}
