import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { parseNvsWorkbook, isNvsWorkbook } from "../src/lib/parsing/nvs";

const path =
  "/Users/asuheylb/Downloads/Veriler-06-26/Net Verimlilik Skoru (NVS).xlsx";
const buf = readFileSync(path);
const wb = XLSX.read(buf, { type: "buffer" });

console.log("isNvsWorkbook:", isNvsWorkbook(wb));

const { facts, nvsRows, warnings } = parseNvsWorkbook(wb, "Net Verimlilik Skoru (NVS).xlsx");

console.log("facts:", facts.length);
console.log("nvsRows:", nvsRows.length);
console.log("warnings:", warnings.length);
if (warnings.length) console.log(warnings.slice(0, 10));

const byLevel = nvsRows.reduce<Record<string, number>>((acc, r) => {
  acc[r.level] = (acc[r.level] ?? 0) + 1;
  return acc;
}, {});
console.log("nvsRows by level:", byLevel);

const konutAmirlik = nvsRows.find(
  (r) => r.level === "amirlik" && r.amirlik === "KONUTBİRLİK SAHA AMİRLİĞİ",
);
console.log("KONUTBİRLİK amirlik row:", JSON.stringify(konutAmirlik, null, 2));

const konutEkipler = nvsRows.filter(
  (r) => r.level === "ekip" && r.amirlik === "KONUTBİRLİK SAHA AMİRLİĞİ",
);
console.log("KONUTBİRLİK ekip sayısı:", konutEkipler.length);
console.log("İlk KONUTBİRLİK ekip:", JSON.stringify(konutEkipler[0], null, 2));

const konutFacts = facts.filter(
  (f) => f.level === "ekip" && f.amirlik === "KONUTBİRLİK SAHA AMİRLİĞİ",
);
console.log("KONUTBİRLİK ekip fact sayısı:", konutFacts.length);
console.log("Örnek fact:", JSON.stringify(konutFacts[0], null, 2));
