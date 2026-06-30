export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          KONUTBİRLİK KPI Paneli
        </h1>
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Çıkış Yap
          </button>
        </form>
      </div>
      <p className="text-sm text-slate-500">
        İskelet hazır — dashboard, yükleme ve hedef ekranları sırayla eklenecek.
      </p>
    </main>
  );
}
