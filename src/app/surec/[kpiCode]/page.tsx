import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getKpiDefinition } from "@/lib/data/dashboard";
import { getRawStats, listRawStatsPeriods } from "@/lib/data/raw-stats";
import { rankColor } from "@/lib/colors";
import { DEFAULT_AMIRLIK } from "@/lib/constants";

function fmt(n: number | null, digits = 1): string {
  if (n === null) return "—";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export default async function SurecPage({
  params,
  searchParams,
}: {
  params: Promise<{ kpiCode: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { kpiCode } = await params;
  const sp = await searchParams;

  const def = await getKpiDefinition(kpiCode);
  if (!def) notFound();

  const periods = await listRawStatsPeriods(kpiCode);
  if (periods.length === 0) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-slate-500">
            {def.name} için henüz ham işemri verisi yüklenmemiş.
          </p>
        </main>
      </>
    );
  }

  const period = sp.p ?? periods[0];
  const stats = await getRawStats(kpiCode, period);
  if (!stats) notFound();

  const uyumOrani = stats.toplam > 0 ? (stats.uyumlu / stats.toplam) * 100 : null;
  const maxHistogram = Math.max(1, ...stats.histogram.map((h) => h.count));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Dashboard&apos;a dön
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">{def.name} — Süreç Detayı</h1>
          <form method="GET" action={`/surec/${kpiCode}`} className="flex items-center gap-2">
            <select
              name="p"
              defaultValue={period}
              className="rounded-md border border-slate-300 p-1.5 text-sm"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Göster
            </button>
          </form>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {DEFAULT_AMIRLIK} · {period}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Toplam İş</p>
            <p className="text-2xl font-semibold text-slate-900">{stats.toplam}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-xs text-slate-500">Süresinde Tamamlanan</p>
            <p className="text-2xl font-semibold text-green-700">{stats.uyumlu}</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs text-slate-500">Süresi Geçen</p>
            <p className="text-2xl font-semibold text-red-700">{stats.uyumsuz}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Uyum Oranı</p>
            <p className="text-2xl font-semibold text-slate-900">
              {uyumOrani === null ? "—" : `${fmt(uyumOrani)}%`}
            </p>
          </div>
        </div>

        {stats.uyumsuz > 0 && (
          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-700">
              Süresi Geçen İşlerin Tamamlanma Süresi
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              Ortalama {fmt(stats.uyumsuzOrtalamaSaat)} saat (en az {fmt(stats.uyumsuzMinSaat)}, en
              fazla {fmt(stats.uyumsuzMaxSaat)} saat) sürede kapatılmış.
            </p>
            <div className="flex items-end gap-3">
              {stats.histogram.map((h) => (
                <div key={h.label} className="flex flex-1 flex-col items-center gap-1">
                  <div className="text-xs text-slate-500">{h.count}</div>
                  <div
                    className="w-full rounded-t bg-red-400"
                    style={{ height: `${Math.max(4, (h.count / maxHistogram) * 96)}px` }}
                  />
                  <div className="text-center text-xs text-slate-400">{h.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-slate-700">Ekip Bazlı Uyum — {period}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-1.5 pr-4">Ekip No</th>
                <th className="py-1.5 pr-4">Uyum Oranı</th>
                <th className="py-1.5 pr-4">Süresinde / Toplam</th>
              </tr>
            </thead>
            <tbody>
              {stats.ekipler.map((e, i) => {
                const colors = rankColor(i, stats.ekipler.length);
                return (
                  <tr key={e.ekipNo} className="border-b border-slate-100">
                    <td className="py-1.5 pr-4 font-mono text-xs">{e.ekipNo}</td>
                    <td className="py-1.5 pr-4">
                      <span className="rounded px-2 py-0.5 font-medium" style={colors}>
                        {e.oran === null ? "—" : `${fmt(e.oran)}%`}
                      </span>
                    </td>
                    <td className="py-1.5 pr-4 text-slate-400">
                      {e.uyumlu} / {e.toplam}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
