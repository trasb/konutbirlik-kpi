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

async function main() {
  const loginRes = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "password=changeme",
    redirect: "manual",
  });
  const cookie = loginRes.headers.get("set-cookie")!.split(";")[0];

  let allRecords: ReturnType<typeof parseRawHamdata>["records"] = [];

  for (const [familyId, fname] of Object.entries(FILES)) {
    const specs = RAW_HAMDATA_BY_FAMILY[familyId];
    if (!specs) continue;
    const buf = readFileSync(DIR + fname);
    const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
    for (const spec of specs) {
      const { records } = parseRawHamdata(wb, spec, fname, PERIOD, AMIRLIK);
      allRecords = allRecords.concat(records);
    }
  }

  // T32 ve T36/T28 (özel dallar)
  const t32buf = readFileSync(DIR + "T32 - Ev İ&ccedil_i Destek Arıza Tekrar Oranı - İnternet.xlsx");
  const t32wb = XLSX.read(t32buf, { type: "buffer", cellDates: true });
  allRecords = allRecords.concat(
    parseRawHamdata(
      t32wb,
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
    ).records,
  );

  const t3628buf = readFileSync(DIR + "T36-T28 Erken Arıza Oranları Hamdata (2).xlsx");
  const t3628wb = XLSX.read(t3628buf, { type: "buffer", cellDates: true });
  allRecords = allRecords.concat(
    parseRawHamdata(
      t3628wb,
      {
        sheetName: "Hamveri",
        kpiCode: "T36_ERKEN_ARIZA",
        mode: "nullMeansSuccess",
        valueHeaders: ["İlk Arıza Zamanı"],
      },
      "T36_28.xlsx",
      PERIOD,
      AMIRLIK,
    ).records,
  );

  console.log("Toplam gönderilecek kayıt:", allRecords.length);

  const res = await fetch("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ facts: [], nvsRows: [], rawRecords: allRecords }),
  });
  console.log(res.status, JSON.stringify(await res.json()));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
