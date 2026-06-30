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

  async function ingest(fname: string, facts: unknown[]) {
    const res = await fetch("http://localhost:3000/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ facts, nvsRows: [] }),
    });
    console.log(fname, "->", res.status, JSON.stringify(await res.json()));
  }

  for (const fname of MULTI_BLOCK_FILES) {
    const buf = readFileSync(DIR + fname);
    const wb = XLSX.read(buf, { type: "buffer" });
    const matches = MULTI_BLOCK_FAMILIES.filter((s) => isMultiBlockWorkbook(wb, s));
    if (matches.length !== 1) {
      console.log(fname, "ATLANDI - eşleşme:", matches.length);
      continue;
    }
    const { facts } = parseMultiBlockWorkbook(wb, matches[0], fname, "2026-06");
    await ingest(fname, facts);
  }

  for (const fname of SEPARATE_FILES) {
    const buf = readFileSync(DIR + fname);
    const wb = XLSX.read(buf, { type: "buffer" });
    const matches = SEPARATE_SHEETS_FAMILIES.filter((s) => isSeparateSheetsWorkbook(wb, s));
    if (matches.length !== 1) {
      console.log(fname, "ATLANDI - eşleşme:", matches.length);
      continue;
    }
    const { facts } = parseSeparateSheetsWorkbook(wb, matches[0], fname, "2026-06");
    await ingest(fname, facts);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
