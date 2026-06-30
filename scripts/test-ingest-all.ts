import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { parseNvsWorkbook, isNvsWorkbook } from "../src/lib/parsing/nvs";
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

async function main() {
  const loginRes = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "password=changeme",
    redirect: "manual",
  });
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) throw new Error("Login başarısız");
  const cookie = setCookie.split(";")[0];

  for (const fname of FILES) {
    const buf = readFileSync(DIR + fname);
    const wb = XLSX.read(buf, { type: "buffer" });

    let facts;
    if (isNvsWorkbook(wb)) {
      ({ facts } = parseNvsWorkbook(wb, fname));
    } else {
      const matches = SEPARATE_SHEETS_FAMILIES.filter((s) => isSeparateSheetsWorkbook(wb, s));
      if (matches.length !== 1) {
        console.log(fname, "ATLANDI - eşleşme sayısı:", matches.length);
        continue;
      }
      ({ facts } = parseSeparateSheetsWorkbook(wb, matches[0], fname, "2026-06"));
    }

    const res = await fetch("http://localhost:3000/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ facts, nvsRows: [] }),
    });
    const body = await res.json();
    console.log(fname, "->", res.status, JSON.stringify(body));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
