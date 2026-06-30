import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import {
  DEFAULT_AMIRLIK,
  DEFAULT_MUDURLUK,
  getKpiDefinition,
  getKpiEkipTable,
  getKpiTrend,
  getLatestPeriod,
} from "@/lib/data/dashboard";

function parseMa(ma: string | undefined): { mudurluk: string; amirlik: string } {
  if (!ma || !ma.includes("||")) return { mudurluk: DEFAULT_MUDURLUK, amirlik: DEFAULT_AMIRLIK };
  const [mudurluk, amirlik] = ma.split("||");
  return { mudurluk, amirlik };
}

function fmt(n: number | null, digits = 1): string {
  if (n === null) return "—";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** index=0 (en başarılı) yeşil, index=total-1 (en başarısız) kırmızı olacak şekilde gradyan üretir. */
function rankColor(index: number, total: number): { backgroundColor: string; color: string } {
  if (total <= 1) return { backgroundColor: "hsl(80 70% 94%)", color: "hsl(80 70% 25%)" };
  const t = index / (total - 1); // 0..1
  const hue = 120 * (1 - t); // 120=yeşil, 0=kırmızı
  return {
    backgroundColor: `hsl(${hue} 70% 94%)`,
    color: `hsl(${hue} 70% 25%)`,
  };
}

export default async function KpiDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ ma?: string; p?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  const { mudurluk, amirlik } = parseMa(sp.ma);

  const def = await getKpiDefinition(code);
  if (!def) notFound();

  const latestPeriod = sp.p ?? (await getLatestPeriod());
  if (!latestPeriod) notFound();

  const [trend, ekipRows] = await Promise.all([
    getKpiTrend(code, mudurluk, amirlik),
    getKpiEkipTable(code, mudurluk, amirlik, latestPeriod),
  ]);

  const sortedEkip = [...ekipRows].sort((a, b) => {
    const av = a.oran ?? (def.direction === "higher_better" ? -Infinity : Infinity);
    const bv = b.oran ?? (def.direction === "higher_better" ? -Infinity : Infinity);
    return def.direction === "higher_better" ? bv - av : av - bv;
  });

  const maQuery = encodeURIComponent(`${mudurluk}||${amirlik}`);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link href={`/?ma=${maQuery}&p=${latestPeriod}`} className="text-sm text-slate-500 hover:underline">
          ← Dashboard&apos;a dön
        </Link>

        <h1 className="mt-2 text-xl font-semibold text-slate-900">{def.name}</h1>
        <p className="text-sm text-slate-500">
          {amirlik} · {mudurluk} · {def.sourceFamily}
        </p>

        {trend.length > 0 && (
          <div className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-700">Aylık Trend</h2>
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {trend.map((t) => {
                const v = t.oran ?? 0;
                const height = t.oran === null ? 4 : Math.max(4, Math.min(96, (v / 100) * 96));
                return (
                  <div key={t.period} className="flex flex-col items-center gap-1">
                    <div className="text-xs text-slate-500">{fmt(t.oran)}%</div>
                    <div
                      className="w-8 rounded-t bg-slate-800"
                      style={{ height: `${height}px` }}
                      title={`${t.period}: ${fmt(t.oran)}%`}
                    />
                    <div className="text-xs text-slate-400">{t.period.slice(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-slate-700">
            Ekip Bazlı Durum — {latestPeriod}
          </h2>
          {sortedEkip.length === 0 ? (
            <p className="text-sm text-slate-400">Bu dönem için ekip bazlı veri yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-1.5 pr-4">Ekip No</th>
                  <th className="py-1.5 pr-4">Oran</th>
                  <th className="py-1.5 pr-4">Pay / Payda</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const withData = sortedEkip.filter((e) => e.oran !== null);
                  let rankIdx = -1;
                  return sortedEkip.map((e) => {
                    const hasData = e.oran !== null;
                    if (hasData) rankIdx++;
                    const colors = hasData ? rankColor(rankIdx, withData.length) : undefined;
                    return (
                      <tr key={e.ekipNo} className="border-b border-slate-100">
                        <td className="py-1.5 pr-4 font-mono text-xs">{e.ekipNo}</td>
                        <td className="py-1.5 pr-4">
                          <span
                            className={colors ? "rounded px-2 py-0.5 font-medium" : ""}
                            style={colors}
                          >
                            {e.oran === null ? "—" : `${fmt(e.oran)}%`}
                          </span>
                        </td>
                        <td className="py-1.5 pr-4 text-slate-400">
                          {e.numerator === null || e.denominator === null
                            ? "—"
                            : `${fmt(e.numerator, 0)} / ${fmt(e.denominator, 0)}`}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
