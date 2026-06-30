import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { isGidisatWorkbook, parseGidisatWorkbook } from "../src/lib/parsing/gidisat";

const path = "/Users/asuheylb/Downloads/Veriler-06-26/GidişaTT Ara Bilgilendirme (26.06.2026).xlsx";
const buf = readFileSync(path);
const wb = XLSX.read(buf, { type: "buffer" });

console.log("isGidisatWorkbook:", isGidisatWorkbook(wb));

const { rows, warnings } = parseGidisatWorkbook(wb, "2026-06");
console.log("rows:", rows.length, "warnings:", warnings.length, warnings);

const ikitelli = rows.find((r) => r.mudurluk === "İKİTELLİ");
console.log("İKİTELLİ:", JSON.stringify(ikitelli, null, 2));

const sortedBySira = [...rows].filter((r) => r.sira !== null).sort((a, b) => (a.sira ?? 0) - (b.sira ?? 0));
console.log("İlk 5 sıra:", sortedBySira.slice(0, 5).map((r) => `${r.sira}. ${r.mudurluk} (${r.skor})`));
console.log("Toplam sıralanmış müdürlük:", sortedBySira.length);
