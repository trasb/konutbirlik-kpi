import { Nav } from "@/components/Nav";
import { AmirlikPeriodSelector } from "@/components/AmirlikPeriodSelector";
import {
  DEFAULT_AMIRLIK,
  DEFAULT_MUDURLUK,
  getLatestPeriod,
  getNvsComponents,
  getNvsTrend,
  listAmirlikler,
  listPeriods,
} from "@/lib/data/dashboard";
import { scoreColor } from "@/lib/colors";

function parseMa(ma: string | undefined): { mudurluk: string; amirlik: string } {
  if (!ma || !ma.includes("||")) return { mudurluk: DEFAULT_MUDURLUK, amirlik: DEFAULT_AMIRLIK };
  const [mudurluk, amirlik] = ma.split("||");
  return { mudurluk, amirlik };
}

function fmt(n: number | null, digits = 1): string {
  if (n === null) return "—";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export default async function NvsPage({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string; p?: string }>;
}) {
  const sp = await searchParams;
  const { mudurluk, amirlik } = parseMa(sp.ma);

  const [amirlikler, periods, latestPeriod] = await Promise.all([
    listAmirlikler(),
    listPeriods(),
    getLatestPeriod(),
  ]);

  if (amirlikler.length === 0 || !latestPeriod) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-slate-500">Henüz NVS verisi yüklenmemiş.</p>
        </main>
      </>
    );
  }

  const period = sp.p ?? latestPeriod;

  const [trend, { toplamPuan, components }] = await Promise.all([
    getNvsTrend(mudurluk, amirlik),
    getNvsComponents(mudurluk, amirlik, period),
  ]);

  const sortedComponents = components; // getNvsComponents zaten GidişaTT sırasıyla döner

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <AmirlikPeriodSelector
          amirlikler={amirlikler}
          periods={periods}
          mudurluk={mudurluk}
          amirlik={amirlik}
          period={period}
          basePath="/nvs"
        />

        <div className="mt-6 flex items-baseline gap-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Net Verimlilik Skoru — {amirlik}
          </h1>
          <span className="text-sm text-slate-500">{mudurluk}</span>
          <span className="text-sm text-slate-400">· {period}</span>
        </div>

        {toplamPuan !== null && (
          <p className="mt-1 text-3xl font-semibold text-slate-900">{fmt(toplamPuan)}</p>
        )}

        {trend.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-700">Aylık Trend</h2>
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {trend.map((t) => {
                const height = t.toplamPuan === null ? 4 : Math.max(4, (t.toplamPuan / 100) * 96);
                return (
                  <div key={t.period} className="flex flex-col items-center gap-1">
                    <div className="text-xs text-slate-500">{fmt(t.toplamPuan)}</div>
                    <div
                      className="w-8 rounded-t bg-slate-800"
                      style={{ height: `${height}px` }}
                      title={`${t.period}: ${fmt(t.toplamPuan)}`}
                    />
                    <div className="text-xs text-slate-400">{t.period.slice(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-slate-700">Bileşenler — {period}</h2>
          {sortedComponents.length === 0 ? (
            <p className="text-sm text-slate-400">Bu dönem için NVS verisi yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-1.5 pr-4">KPI</th>
                  <th className="py-1.5 pr-4">Oran</th>
                  <th className="py-1.5 pr-4">Skor (1-5)</th>
                </tr>
              </thead>
              <tbody>
                {sortedComponents.map((c) => {
                  const colors = scoreColor(c.skor);
                  return (
                    <tr key={c.kpiCode} className="border-b border-slate-100">
                      <td className="py-1.5 pr-4">{c.name}</td>
                      <td className="py-1.5 pr-4">{c.oran === null ? "—" : `${fmt(c.oran)}%`}</td>
                      <td className="py-1.5 pr-4">
                        <span
                          className={colors ? "rounded px-2 py-0.5 font-medium" : "font-medium"}
                          style={colors}
                        >
                          {fmt(c.skor)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
