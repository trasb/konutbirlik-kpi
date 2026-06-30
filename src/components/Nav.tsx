import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b border-slate-200 px-6 py-3 text-sm">
      <Link href="/" className="font-semibold text-slate-900">
        KONUTBİRLİK KPI Paneli
      </Link>
      <Link href="/" className="text-slate-600 hover:text-slate-900">
        Dashboard
      </Link>
      <Link href="/upload" className="text-slate-600 hover:text-slate-900">
        Excel Yükle
      </Link>
      <Link href="/hedefler" className="text-slate-600 hover:text-slate-900">
        Hedefler
      </Link>
      <form action="/api/logout" method="POST" className="ml-auto">
        <button type="submit" className="text-slate-500 hover:text-slate-900">
          Çıkış Yap
        </button>
      </form>
    </nav>
  );
}
