"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { isNvsWorkbook, parseNvsWorkbook } from "@/lib/parsing/nvs";
import {
  isSeparateSheetsWorkbook,
  parseSeparateSheetsWorkbook,
} from "@/lib/parsing/generic-separate-sheets";
import { SEPARATE_SHEETS_FAMILIES } from "@/lib/parsing/family-specs";
import type { ParseResult } from "@/lib/parsing/types";

type Status =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "parsed"; result: ParseResult; fileName: string; familyId: string }
  | { kind: "uploading" }
  | { kind: "done"; factsWritten: number; nvsWritten: number }
  | { kind: "error"; message: string };

function defaultPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function UploadPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [period, setPeriod] = useState(defaultPeriod());

  async function handleFile(file: File) {
    setStatus({ kind: "parsing" });
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      if (isNvsWorkbook(wb)) {
        const result = parseNvsWorkbook(wb, file.name);
        setStatus({ kind: "parsed", result, fileName: file.name, familyId: "NVS" });
        return;
      }

      const matches = SEPARATE_SHEETS_FAMILIES.filter((spec) => isSeparateSheetsWorkbook(wb, spec));
      if (matches.length === 1) {
        const spec = matches[0];
        const result = parseSeparateSheetsWorkbook(wb, spec, file.name, period);
        setStatus({ kind: "parsed", result, fileName: file.name, familyId: spec.id });
        return;
      }
      if (matches.length > 1) {
        setStatus({
          kind: "error",
          message: `Dosya birden fazla rapor tipiyle eşleşti (${matches.map((m) => m.id).join(", ")}), bu beklenmiyordu — lütfen bildir.`,
        });
        return;
      }

      setStatus({
        kind: "error",
        message:
          "Bu dosya tanınan bir rapor ailesine uymuyor. Desteklenen dosyalar: Net Verimlilik Skoru (NVS), İnternet Arıza Randevuya Uyum, T19/T99 Randevuya Uyum, T27/T30 Kurulum Tamamlanma, T41/T43 Port Testi, T4/T5/T7/T70/T29 Kurulum Süre Uyum, T37 Kronik Arıza, T39 IPTV Erken Arıza, Teyitten Dönen Arıza.",
      });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  async function handleConfirm() {
    if (status.kind !== "parsed") return;
    setStatus({ kind: "uploading" });
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts: status.result.facts, nvsRows: status.result.nvsRows }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sunucu hatası: ${res.status} ${text}`);
      }
      const data = await res.json();
      setStatus({ kind: "done", factsWritten: data.factsWritten, nvsWritten: data.nvsWritten });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-xl font-semibold text-slate-900">Excel Yükle</h1>
      <p className="text-sm text-slate-500">
        Desteklenen dosyalar: NVS, İnternet Arıza Randevuya Uyum, T19/T99, T27/T30, T41/T43,
        T4/T5/T7/T70/T29, T37 Kronik Arıza, T39 IPTV Erken Arıza, Teyitten Dönen Arıza.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="period">
          Dönem (NVS ve T39 dışındaki dosyalar için kullanılır)
        </label>
        <input
          id="period"
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border border-slate-300 p-2 text-sm"
        />
      </div>

      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="rounded-md border border-slate-300 p-2 text-sm"
      />

      {status.kind === "parsing" && <p className="text-sm text-slate-500">Dosya parse ediliyor…</p>}

      {status.kind === "parsed" && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-medium text-slate-800">
            {status.fileName} <span className="text-slate-400">({status.familyId})</span>
          </p>
          <ul className="mt-2 list-disc pl-5 text-slate-600">
            <li>{status.result.facts.length} KPI fact satırı</li>
            <li>{status.result.nvsRows.length} NVS scorecard satırı</li>
            <li>{status.result.warnings.length} uyarı</li>
          </ul>
          {status.result.warnings.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-amber-700">Uyarıları gör</summary>
              <ul className="mt-1 max-h-40 overflow-y-auto text-xs text-amber-700">
                {status.result.warnings.slice(0, 50).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
          <button
            onClick={handleConfirm}
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Onayla ve Kaydet
          </button>
        </div>
      )}

      {status.kind === "uploading" && <p className="text-sm text-slate-500">Veritabanına yazılıyor…</p>}

      {status.kind === "done" && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Kaydedildi: {status.factsWritten} fact, {status.nvsWritten} NVS satırı.
        </p>
      )}

      {status.kind === "error" && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{status.message}</p>
      )}
    </main>
  );
}
