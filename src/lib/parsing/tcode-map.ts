/** Excel başlıklarındaki "(T4)" gibi T-kodlarını kpi_definitions.kpiCode'a eşler. */
export const TCODE_TO_KPI_CODE: Record<string, string> = {
  T4: "T4_KURULUM_SURE_UYUM",
  T5: "T5_DTH_KURULUM_SURE_UYUM",
  T29: "T29_DONUSUM_SURE_UYUM",
  T70: "T70_SES_KURULUM_SURE_UYUM",
  T7: "T7_IPTV_KURULUM_SURE_UYUM",
  T71: "T71_SES_ARIZA_SURE_UYUM",
  T13: "T13_ARIZA_SURE_UYUM",
  T16: "T16_TV_ARIZA_SURE_UYUM",
  T19: "T19_ILK_RANDEVU_UYUM",
  T99: "T99_TV_RANDEVU_UYUM",
  T25: "T25_KURULUM_TAMAMLANMA",
  T8: "T8_DONUSUM_TAMAMLANMA",
  T27: "T27_IPTV_KURULUM_TAMAMLANMA",
  T30: "T30_DTH_KURULUM_TAMAMLANMA",
  T33: "T33_TEKRAR_EDEN_ARIZA",
  T32: "T32_EV_ICI_TEKRAR",
  T34: "T34_IPTV_TEKRAR_ARIZA",
  T37: "T37_KRONIK_ARIZA",
  T36: "T36_ERKEN_ARIZA",
  T28: "T28_DONUSUM_ERKEN_ARIZA",
  T39: "T39_IPTV_ERKEN_ARIZA_YS",
  T95: "T95_DSL_MUSTERI_BASINA_ARIZA",
  T96: "T96_FTTH_MUSTERI_BASINA_ARIZA",
  T18: "T18_BASARILI_ELITT",
  T41: "T41_DSL_PORT_TESTI",
  T43: "T43_FTTH_PORT_TESTI",
};

/** "Kurulum Sürelerine Uyum Oranı — İnternet (T4)" gibi bir etiketten "T4" çıkarır. */
export function extractTCode(label: string): string | null {
  const m = label.match(/\(([A-Z]+\d+)\)/);
  return m ? m[1] : null;
}
