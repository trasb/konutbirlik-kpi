import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { isMultiBlockWorkbook, parseMultiBlockWorkbook } from "../src/lib/parsing/generic-multi-block";
import {
  isSeparateSheetsWorkbook,
  parseSeparateSheetsWorkbook,
} from "../src/lib/parsing/generic-separate-sheets";
import { MULTI_BLOCK_FAMILIES, SEPARATE_SHEETS_FAMILIES } from "../src/lib/parsing/family-specs";

const DIR = "/Users/asuheylb/Downloads/Veriler-06-26/";
const MULTI_BLOCK_FILES = [
  "T18 Başarılı Elitt Oranı (1).xlsx",
  "T8 - Başarılı D&ouml_n&uuml_ş&uuml_m Oranı - İnternet.xlsx",
  "T25 İnternet Kurulum Tamamlanma Oranı Hamdata  (2).xlsx",
  "T33 İnternet Tekrar Eden Arıza Oranı Hamdata (5).xlsx",
];
const SEPARATE_FILES = ["T34 IPTV Tekrar Eden Arıza Oranı Hamdata (3).xlsx"];

for (const fname of MULTI_BLOCK_FILES) {
  const buf = readFileSync(DIR + fname);
  const wb = XLSX.read(buf, { type: "buffer" });
  const matches = MULTI_BLOCK_FAMILIES.filter((s) => isMultiBlockWorkbook(wb, s));
  console.log("=".repeat(80));
  console.log(fname, "-> eşleşen:", matches.map((m) => m.id));
  if (matches.length !== 1) {
    console.log("  UYARI: tam 1 eşleşme bekleniyordu:", matches.length);
    continue;
  }
  const { facts, warnings } = parseMultiBlockWorkbook(wb, matches[0], fname, "2026-06");
  console.log("  facts:", facts.length, "warnings:", warnings.length);
  if (warnings.length) console.log("  ", warnings.slice(0, 5));
  for (const level of ["amirlik", "ekip"] as const) {
    const row = facts.find(
      (f) => f.level === level && f.amirlik === "KONUTBİRLİK SAHA AMİRLİĞİ" && f.mudurluk === "İKİTELLİ",
    );
    console.log(`  KONUTBİRLİK ${level} (İKİTELLİ):`, JSON.stringify(row ?? null));
  }
}

for (const fname of SEPARATE_FILES) {
  const buf = readFileSync(DIR + fname);
  const wb = XLSX.read(buf, { type: "buffer" });
  const matches = SEPARATE_SHEETS_FAMILIES.filter((s) => isSeparateSheetsWorkbook(wb, s));
  console.log("=".repeat(80));
  console.log(fname, "-> eşleşen:", matches.map((m) => m.id));
  if (matches.length !== 1) {
    console.log("  UYARI: tam 1 eşleşme bekleniyordu:", matches.length);
    continue;
  }
  const { facts, warnings } = parseSeparateSheetsWorkbook(wb, matches[0], fname, "2026-06");
  console.log("  facts:", facts.length, "warnings:", warnings.length);
  const row = facts.find((f) => f.level === "amirlik" && f.amirlik === "KONUTBİRLİK SAHA AMİRLİĞİ");
  console.log("  KONUTBİRLİK amirlik:", JSON.stringify(row ?? null));
}
