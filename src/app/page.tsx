import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AmirlikPeriodSelector } from "@/components/AmirlikPeriodSelector";
import {
  DEFAULT_AMIRLIK,
  DEFAULT_MUDURLUK,
  getKpiCards,
  getLatestPeriod,
  listAmirlikler,
  listPeriods,
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

export default async function Home({
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
          <p className="text-sm text-slate-500">
            Henüz veri yüklenmemiş.{" "}
            <Link href="/upload" className="text-slate-900 underline">
              Excel Yükle
            </Link>{" "}
            sayfasından başlayabilirsin.
          </p>
        </main>
      </>
    );
  }

  const period = sp.p ?? latestPeriod;

  const cards = await getKpiCards(mudurluk, amirlik, period);

  const offTarget = cards.filter((c) => c.onTarget === false);
  const onTarget = cards.filter((c) => c.onTarget === true);
  const noData = cards.filter((c) => c.oran === null);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <AmirlikPeriodSelector
          amirlikler={amirlikler}
          periods={periods}
          mudurluk={mudurluk}
          amirlik={amirlik}
          period={period}
        />

        <div className="mt-6 flex items-baseline gap-4">
          <h1 className="text-lg font-semibold text-slate-900">{amirlik}</h1>
          <span className="text-sm text-slate-500">{mudurluk}</span>
          <span className="text-sm text-slate-400">· {period}</span>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Net Verimlilik Skoru toplam puanı ve bileşen kırılımı için{" "}
          <Link
            href={`/nvs?ma=${encodeURIComponent(`${mudurluk}||${amirlik}`)}&p=${period}`}
            className="text-slate-900 underline"
          >
            NVS sayfasına
          </Link>{" "}
          bak.
        </p>

        <div className="mt-6 flex gap-4 text-sm">
          <span className="text-slate-500">
            Hedefte: <span className="font-medium text-green-700">{onTarget.length}</span>
          </span>
          <span className="text-slate-500">
            Hedef altında: <span className="font-medium text-red-700">{offTarget.length}</span>
          </span>
          <span className="text-slate-500">
            Veri/hedef yok: <span className="font-medium text-slate-700">{noData.length}</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.kpiCode}
              href={`/kpi/${c.kpiCode}?ma=${encodeURIComponent(`${mudurluk}||${amirlik}`)}&p=${period}`}
              className={`rounded-lg border p-4 transition hover:shadow-sm ${
                c.onTarget === false
                  ? "border-red-200 bg-red-50"
                  : c.onTarget === true
                    ? "border-green-200 bg-green-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-medium text-slate-800">{c.name}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {c.oran === null ? "—" : `${fmt(c.oran)}%`}
                </span>
                {c.target !== null && (
                  <span className="text-xs text-slate-500">hedef {fmt(c.target)}%</span>
                )}
              </div>
              {c.gap !== null && c.gap > 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  {c.direction === "higher_better"
                    ? `Hedefe ulaşmak için ${c.gap} başarılı iş daha lazım`
                    : `Hedefe ulaşmak için ${c.gap} vakanın azalması lazım`}
                </p>
              )}
              {c.numerator !== null && c.denominator !== null && (
                <p className="mt-1 text-xs text-slate-400">
                  {fmt(c.numerator, 0)} / {fmt(c.denominator, 0)}
                </p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
