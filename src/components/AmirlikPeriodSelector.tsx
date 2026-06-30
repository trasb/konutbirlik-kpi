"use client";

import { useRef } from "react";
import type { AmirlikOption } from "@/lib/data/dashboard";

export function AmirlikPeriodSelector({
  amirlikler,
  periods,
  mudurluk,
  amirlik,
  period,
  basePath = "/",
}: {
  amirlikler: AmirlikOption[];
  periods: string[];
  mudurluk: string;
  amirlik: string;
  period: string;
  basePath?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} method="GET" action={basePath} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Amirlik</label>
        <select
          name="ma"
          defaultValue={`${mudurluk}||${amirlik}`}
          onChange={() => formRef.current?.requestSubmit()}
          className="rounded-md border border-slate-300 p-1.5 text-sm"
        >
          {amirlikler.map((a) => (
            <option key={`${a.mudurluk}||${a.amirlik}`} value={`${a.mudurluk}||${a.amirlik}`}>
              {a.mudurluk} — {a.amirlik}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Dönem</label>
        <select
          name="p"
          defaultValue={period}
          onChange={() => formRef.current?.requestSubmit()}
          className="rounded-md border border-slate-300 p-1.5 text-sm"
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
