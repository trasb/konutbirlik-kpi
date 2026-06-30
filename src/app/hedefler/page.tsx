import { Nav } from "@/components/Nav";
import { getAllKpiDefinitionsWithGoals } from "@/lib/data/dashboard";
import { updateGoal } from "./actions";

export default async function HedeflerPage() {
  const defs = await getAllKpiDefinitionsWithGoals();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl font-semibold text-slate-900">Hedefler</h1>
        <p className="mt-1 text-sm text-slate-500">
          Varsayılan hedefler NVS dosyasındaki Altın skala eşiklerinden geldi. Boş olanları veya
          değiştirmek istediklerini buradan elle girebilirsin.
        </p>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4">KPI</th>
              <th className="py-2 pr-4">Yön</th>
              <th className="py-2 pr-4">Hedef (%)</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {defs.map((d) => (
              <tr key={d.kpiCode} className="border-b border-slate-100">
                <td className="py-2 pr-4">
                  <div className="font-medium text-slate-800">{d.name}</div>
                  <div className="text-xs text-slate-400">
                    {d.kpiCode} · {d.sourceFamily}
                  </div>
                </td>
                <td className="py-2 pr-4 text-xs text-slate-500">
                  {d.direction === "higher_better" ? "Yüksek iyi" : "Düşük iyi"}
                </td>
                <td className="py-2 pr-4">
                  <form action={updateGoal} className="flex items-center gap-2">
                    <input type="hidden" name="kpiCode" value={d.kpiCode} />
                    <input
                      type="number"
                      step="0.01"
                      name="targetValue"
                      defaultValue={d.effectiveTarget ?? ""}
                      placeholder="—"
                      className="w-24 rounded-md border border-slate-300 p-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Kaydet
                    </button>
                  </form>
                </td>
                <td className="py-2 pr-4 text-xs text-slate-400">
                  {d.hasOverride ? "elle girildi" : d.targetGold !== null ? "NVS Altın" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
