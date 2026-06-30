// "GidişaTT - Amirlik" dosyasının kolon sırası — kullanıcı tüm toplu KPI listelerinin bu
// sırayla görünmesini istedi. Bu dosyada olmayan KPI'lar (T9, T18, T41/T43, T13 randevu vb.)
// listenin sonuna, kendi aralarında alfabetik eklenir.
export const GIDISAT_AMIRLIK_KPI_ORDER: string[] = [
  "T4_KURULUM_SURE_UYUM",
  "T29_DONUSUM_SURE_UYUM",
  "T70_SES_KURULUM_SURE_UYUM",
  "T7_IPTV_KURULUM_SURE_UYUM",
  "T71_SES_ARIZA_SURE_UYUM",
  "T13_ARIZA_SURE_UYUM",
  "T16_TV_ARIZA_SURE_UYUM",
  "T19_ILK_RANDEVU_UYUM",
  "T99_TV_RANDEVU_UYUM",
  "T25_KURULUM_TAMAMLANMA",
  "T8_DONUSUM_TAMAMLANMA",
  "T27_IPTV_KURULUM_TAMAMLANMA",
  "T33_TEKRAR_EDEN_ARIZA",
  "T32_EV_ICI_DESTEK",
  "T32_EV_ICI_TEKRAR",
  "T34_IPTV_TEKRAR_ARIZA",
  "T37_KRONIK_ARIZA",
  "T36_ERKEN_ARIZA",
  "T28_DONUSUM_ERKEN_ARIZA",
  "T39_IPTV_ERKEN_ARIZA_YS",
  "T95_DSL_MUSTERI_BASINA_ARIZA",
  "T96_FTTH_MUSTERI_BASINA_ARIZA",
];

const ORDER_INDEX = new Map(GIDISAT_AMIRLIK_KPI_ORDER.map((code, i) => [code, i]));

export function sortByKpiOrder<T extends { kpiCode: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = ORDER_INDEX.get(a.kpiCode) ?? Infinity;
    const bi = ORDER_INDEX.get(b.kpiCode) ?? Infinity;
    if (ai !== bi) return ai - bi;
    return a.kpiCode.localeCompare(b.kpiCode);
  });
}
