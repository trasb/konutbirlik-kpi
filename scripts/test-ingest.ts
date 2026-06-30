import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { parseNvsWorkbook } from "../src/lib/parsing/nvs";

const path =
  "/Users/asuheylb/Downloads/Veriler-06-26/Net Verimlilik Skoru (NVS).xlsx";
const buf = readFileSync(path);
const wb = XLSX.read(buf, { type: "buffer" });
const { facts, nvsRows } = parseNvsWorkbook(wb, "Net Verimlilik Skoru (NVS).xlsx");

async function main() {
  const loginRes = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "password=changeme",
    redirect: "manual",
  });
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) throw new Error("Login başarısız, cookie alınamadı");
  const cookie = setCookie.split(";")[0];

  const res = await fetch("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ facts, nvsRows }),
  });
  const text = await res.text();
  console.log("status:", res.status);
  console.log("body:", text);

  // İkinci kez aynı veriyi gönder, upsert idempotency'sini doğrula.
  const res2 = await fetch("http://localhost:3000/api/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ facts, nvsRows }),
  });
  console.log("2. yükleme status:", res2.status, await res2.text());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
