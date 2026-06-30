import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import {
  isSeparateSheetsWorkbook,
  parseSeparateSheetsWorkbook,
} from "../src/lib/parsing/generic-separate-sheets";
import { SEPARATE_SHEETS_FAMILIES } from "../src/lib/parsing/family-specs";

const DIR = "/Users/asuheylb/Downloads/Veriler-06-26/";
const FILES = [
  "İnternet Arıza Randevuya Uyum Oranı Hamdata.xlsx",
  "T19_99 Randevuya Uyum Oranları Hamdata.xlsx",
  "T27_30 Kurulum Tamamlanma Oranları Hamdata.xlsx",
  "T41_43 Port Testi Başarılı Yapılma Oranları Hamdata.xlsx",
  "T4_5_7_70 Kurulum S&uuml_relerine Uyum Oranları Hamdata.xlsx",
  "T37_38 Kronik Arıza Oranları Hamdata (3).xlsx",
  "T39 IPTV Erken Arıza Oranı (Yeni Satış) Hamdata.xlsx",
  "Teyitten D&ouml_nen Arıza Oranı (3).xlsx",
];

for (const fname of FILES) {
  const buf = readFileSync(DIR + fname);
  const wb = XLSX.read(buf, { type: "buffer" });

  const matches = SEPARATE_SHEETS_FAMILIES.filter((spec) => isSeparateSheetsWorkbook(wb, spec));
  console.log("=".repeat(80));
  console.log(fname, "-> eşleşen spec(ler):", matches.map((m) => m.id));

  if (matches.length !== 1) {
    console.log("  UYARI: tam olarak 1 eşleşme bekleniyordu, bulunan:", matches.length);
    continue;
  }

  const spec = matches[0];
  const { facts, warnings } = parseSeparateSheetsWorkbook(wb, spec, fname, "2026-06");
  console.log("  facts:", facts.length, "warnings:", warnings.length);
  if (warnings.length) console.log("  ", warnings.slice(0, 5));

  const konut = facts.filter((f) => f.amirlik === "KONUTBİRLİK SAHA AMİRLİĞİ" && f.level === "amirlik");
  console.log("  KONUTBİRLİK amirlik-level fact:", JSON.stringify(konut[0] ?? null));
  const konutEkip = facts.filter((f) => f.amirlik === "KONUTBİRLİK SAHA AMİRLİĞİ" && f.level === "ekip");
  console.log("  KONUTBİRLİK ekip-level fact sayısı:", konutEkip.length, JSON.stringify(konutEkip[0] ?? null));
}
