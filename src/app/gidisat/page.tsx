import { Nav } from "@/components/Nav";
import { DEFAULT_MUDURLUK } from "@/lib/data/dashboard";
import { getGidisatDetail, getGidisatRanking, listGidisatPeriods } from "@/lib/data/gidisat";

function fmt(n: number | null, digits = 1): string {
  if (n === null) return "—";
  return n.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export default async function GidisatPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  const periods = await listGidisatPeriods();

  if (periods.length === 0) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-slate-500">
            Henüz GidişaTT Ara Bilgilendirme verisi yüklenmemiş.
          </p>
        </main>
      </>
    );
  }

  const period = sp.p ?? periods[0];
  const [ranking, detail] = await Promise.all([
    getGidisatRanking(period),
    getGidisatDetail(DEFAULT_MUDURLUK, period),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">GidişaTT Ara Bilgilendirme</h1>
          <form method="GET" action="/gidisat" className="flex items-center gap-2">
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
          Müdürlüklerin bölge içi sıralaması ve skoru — {period}
        </p>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-1.5 pr-4">Sıra</th>
              <th className="py-1.5 pr-4">Müdürlük</th>
              <th className="py-1.5 pr-4">Skor</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => (
              <tr
                key={r.mudurluk}
                className={`border-b border-slate-100 ${
                  r.mudurluk === DEFAULT_MUDURLUK ? "bg-amber-50 font-medium" : ""
                }`}
              >
                <td className="py-1.5 pr-4">{r.sira ?? "—"}</td>
                <td className="py-1.5 pr-4">
                  {r.mudurluk}
                  {r.mudurluk === DEFAULT_MUDURLUK && (
                    <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs text-amber-900">
                      KONUTBİRLİK&apos;in müdürlüğü
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-4">{fmt(r.skor, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {detail && Object.keys(detail.kpiValues).length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-sm font-medium text-slate-700">
              {DEFAULT_MUDURLUK} — KPI Kırılımı
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(detail.kpiValues).map(([label, value]) => (
                  <tr key={label} className="border-b border-slate-100">
                    <td className="py-1.5 pr-4 text-slate-600">{label}</td>
                    <td className="py-1.5 pr-4 font-medium">{fmt(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
