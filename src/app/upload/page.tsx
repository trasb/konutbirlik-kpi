"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { isNvsWorkbook, parseNvsWorkbook } from "@/lib/parsing/nvs";
import type { ParseResult } from "@/lib/parsing/types";

type Status =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "parsed"; result: ParseResult; fileName: string }
  | { kind: "uploading" }
  | { kind: "done"; factsWritten: number; nvsWritten: number }
  | { kind: "error"; message: string };

export default function UploadPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleFile(file: File) {
    setStatus({ kind: "parsing" });
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      if (!isNvsWorkbook(wb)) {
        setStatus({
          kind: "error",
          message:
            "Bu dosya tanınan bir rapor ailesine uymuyor. Şu an sadece 'Net Verimlilik Skoru (NVS)' dosyası destekleniyor, diğer KPI dosyaları sırayla eklenecek.",
        });
        return;
      }

      const result = parseNvsWorkbook(wb, file.name);
      setStatus({ kind: "parsed", result, fileName: file.name });
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
        Şu an sadece <code>Net Verimlilik Skoru (NVS).xlsx</code> dosyası destekleniyor. Diğer KPI
        dosyaları (T4, T18, T25...) sırayla eklenecek.
      </p>

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
          <p className="font-medium text-slate-800">{status.fileName}</p>
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
