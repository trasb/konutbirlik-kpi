import { Nav } from "@/components/Nav";
import { AmirlikPeriodSelector } from "@/components/AmirlikPeriodSelector";
import { DEFAULT_AMIRLIK, DEFAULT_MUDURLUK } from "@/lib/constants";
import { getAllKpiDefinitionsWithGoals, listAmirlikler } from "@/lib/data/dashboard";
import { getGidisatAmirlikDetail, listGidisatAmirlikPeriods } from "@/lib/data/gidisat-amirlik";
import { targetColor } from "@/lib/colors";
import { sortByKpiOrder } from "@/lib/kpi-order";

function parseMa(ma: string | undefined): { mudurluk: string; amirlik: string } {
  if (!ma || !ma.includes("||")) return { mudurluk: DEFAULT_MUDURLUK, amirlik: DEFAULT_AMIRLIK };
  const [mudurluk, amirlik] = ma.split("||");
  return { mudurluk, amirlik };
}

function fmt(n: number | null, digits = 1): string {
  if (n === null) return "—";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export default async function GidisatAmirlikPage({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string; p?: string }>;
}) {
  const sp = await searchParams;
  const { mudurluk, amirlik } = parseMa(sp.ma);

  const [amirlikler, periods] = await Promise.all([listAmirlikler(), listGidisatAmirlikPeriods()]);

  if (periods.length === 0) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-slate-500">Henüz GidişaTT Amirlik verisi yüklenmemiş.</p>
        </main>
      </>
    );
  }

  const period = sp.p ?? periods[0];

  const [detail, kpiDefs] = await Promise.all([
    getGidisatAmirlikDetail(mudurluk, amirlik, period),
    getAllKpiDefinitionsWithGoals(),
  ]);
  const defByCode = new Map(kpiDefs.map((d) => [d.kpiCode, d]));

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
          basePath="/gidisat-amirlik"
        />

        <div className="mt-6 flex items-baseline gap-4">
          <h1 className="text-lg font-semibold text-slate-900">GidişaTT Amirlik — {amirlik}</h1>
          <span className="text-sm text-slate-500">{mudurluk}</span>
          <span className="text-sm text-slate-400">· {period}</span>
        </div>

        {!detail || Object.keys(detail.kpiValues).length === 0 ? (
          <p className="mt-6 text-sm text-slate-400">
            Bu amirlik/dönem için GidişaTT Amirlik verisi yok.
          </p>
        ) : (
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-1.5 pr-4">KPI</th>
                <th className="py-1.5 pr-4">Oran</th>
                <th className="py-1.5 pr-4">Hedef</th>
              </tr>
            </thead>
            <tbody>
              {sortByKpiOrder(
                Object.entries(detail.kpiValues).map(([kpiCode, value]) => ({ kpiCode, value })),
              ).map(({ kpiCode, value }) => {
                const def = defByCode.get(kpiCode);
                const colors = def ? targetColor(value, def.effectiveTarget, def.direction) : undefined;
                return (
                  <tr key={kpiCode} className="border-b border-slate-100">
                    <td className="py-1.5 pr-4 text-slate-600">{def?.name ?? kpiCode}</td>
                    <td className="py-1.5 pr-4">
                      <span
                        className={colors ? "rounded px-2 py-0.5 font-medium" : "font-medium"}
                        style={colors}
                      >
                        {fmt(value)}%
                      </span>
                    </td>
                    <td className="py-1.5 pr-4 text-xs text-slate-400">
                      {def?.effectiveTarget !== null && def?.effectiveTarget !== undefined
                        ? `${fmt(def.effectiveTarget)}%`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
