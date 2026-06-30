import { SeparateSheetsFamilySpec } from "./generic-separate-sheets";
import { MultiBlockFamilySpec } from "./generic-multi-block";

export const SEPARATE_SHEETS_FAMILIES: SeparateSheetsFamilySpec[] = [
  {
    id: "INTERNET_ARIZA_RANDEVU",
    metrics: [{ kpiCode: "T13_INTERNET_ARIZA_RANDEVU" }],
    sheets: [
      { sheetName: "Randevuya Uyum-Müdürlük", level: "mudurluk" },
      { sheetName: "Randevuya Uyum-Amirlik", level: "amirlik" },
      { sheetName: "Randevuya Uyum-Ekip", level: "ekip" },
    ],
    // T19_99 dosyası da aynı sayfa adlarını kullanıyor; bu metinle ayırt ediyoruz.
    matchSignal: { sheetName: "Randevuya Uyum-Müdürlük", cellText: "İnternet Arıza" },
  },
  {
    id: "T19_99",
    metrics: [{ kpiCode: "T19_ILK_RANDEVU_UYUM" }, { kpiCode: "T99_TV_RANDEVU_UYUM" }],
    sheets: [
      { sheetName: "Randevuya Uyum-Müdürlük", level: "mudurluk" },
      { sheetName: "Randevuya Uyum-Amirlik", level: "amirlik" },
      { sheetName: "Randevuya Uyum-Ekip", level: "ekip" },
    ],
    matchSignal: { sheetName: "Randevuya Uyum-Müdürlük", cellText: "T19 - İlk Randevu - İnt." },
  },
  {
    id: "T27_30",
    metrics: [{ kpiCode: "T27_IPTV_KURULUM_TAMAMLANMA" }, { kpiCode: "T30_DTH_KURULUM_TAMAMLANMA" }],
    sheets: [
      { sheetName: "Kurulum Tamamlanma-Müdürlük", level: "mudurluk" },
      { sheetName: "Kurulum Tamamlanma-Amirlik", level: "amirlik" },
      { sheetName: "Kurulum Tamamlanma-Ekip", level: "ekip" },
    ],
  },
  {
    id: "T41_43",
    metrics: [{ kpiCode: "T41_DSL_PORT_TESTI" }, { kpiCode: "T43_FTTH_PORT_TESTI" }],
    sheets: [
      { sheetName: "Port Testi Oranları-Müdürlük", level: "mudurluk" },
      { sheetName: "Port Testi Oranları-Amirlik", level: "amirlik" },
      { sheetName: "Port Testi Oranları-Ekip", level: "ekip" },
    ],
  },
  {
    id: "T4_5_7_70",
    metrics: [
      { kpiCode: "T70_SES_KURULUM_SURE_UYUM" },
      { kpiCode: "T4_KURULUM_SURE_UYUM" },
      { kpiCode: "T7_IPTV_KURULUM_SURE_UYUM" },
      { kpiCode: "T29_DONUSUM_SURE_UYUM" },
    ],
    sheets: [
      { sheetName: "Kurulum Süre Uyum-Müdürlük", level: "mudurluk" },
      { sheetName: "Kurulum Süre Uyum-Amirlik", level: "amirlik" },
      { sheetName: "Kurulum Süre Uyum-Ekip", level: "ekip" },
    ],
  },
  {
    id: "T37_38",
    metrics: [{ kpiCode: "T37_KRONIK_ARIZA" }],
    sheets: [
      { sheetName: "Kronik Arıza Oranları - Müdürlü", level: "mudurluk" },
      { sheetName: "Kronik Arıza Oranları - Amirlik", level: "amirlik" },
      { sheetName: "Kronik Arıza Oranları - Ekip ", level: "ekip" },
    ],
  },
  {
    id: "T39",
    metrics: [{ kpiCode: "T39_IPTV_ERKEN_ARIZA_YS" }],
    sheets: [
      { sheetName: "Müdürlük", level: "mudurluk" },
      { sheetName: "Amirlik", level: "amirlik" },
      { sheetName: "Ekip", level: "ekip" },
    ],
    hasInlineDonem: true,
    // T39 ve Teyitten aynı jenerik sayfa adlarını kullanıyor; bu metinle ayırt ediyoruz.
    matchSignal: { sheetName: "Müdürlük", cellText: "IPTV Erken Arıza Oranı - Yeni Satış" },
  },
  {
    id: "TEYITTEN_DONEN",
    metrics: [{ kpiCode: "TEYITTEN_DONME" }],
    sheets: [
      { sheetName: "Müdürlük", level: "mudurluk" },
      { sheetName: "Amirlik", level: "amirlik" },
      { sheetName: "Ekip", level: "ekip" },
    ],
    matchSignal: { sheetName: "Müdürlük", cellText: "Teyitten Dönen" },
  },
  {
    id: "T34",
    metrics: [{ kpiCode: "T34_IPTV_TEKRAR_ARIZA" }],
    sheets: [
      { sheetName: "Tekrar Arıza Oranı-Müdürlük", level: "mudurluk" },
      { sheetName: "Tekrar Arıza Oranı-Amirlik", level: "amirlik" },
    ],
  },
];

export const MULTI_BLOCK_FAMILIES: MultiBlockFamilySpec[] = [
  {
    id: "T18",
    sheetName: "T18 - Toplam",
    kpiCode: "T18_BASARILI_ELITT",
    blocks: ["mudurluk", "amirlik", "ekip"],
    oranIsFraction: true,
    matchSignal: { cellText: "Başarılı EliTT Oranı" },
  },
  {
    id: "T8",
    sheetName: "TM",
    kpiCode: "T8_DONUSUM_TAMAMLANMA",
    blocks: ["mudurluk", "amirlik", "ekip"],
    oranIsFraction: true,
    // T32 dosyası da "TM" adında bir sayfaya sahip; bu metinle ayırt ediyoruz.
    matchSignal: { cellText: "Başarılı Tamamlanma Oranı" },
  },
  {
    id: "T25_STANDALONE",
    sheetName: "T25 - TOPLAM",
    kpiCode: "T25_KURULUM_TAMAMLANMA",
    blocks: ["mudurluk", "amirlik", "ekip"],
  },
  {
    id: "T33_STANDALONE",
    sheetName: "T33 - TOPLAM",
    kpiCode: "T33_TEKRAR_EDEN_ARIZA",
    // "Müdürlük (Aristo Hariç)" ve "Ekip" bloklarını atlıyoruz: Aristo-hariç varyantı ayrı bir
    // KPI değil; Ekip bloğu ise "tekrara sebep olan ekip" perspektifiyle NVS'nin "ıslah eden
    // ekip" perspektifinden farklı bir anlam taşıyor — aynı KPI koduna karışırsa veriler
    // birbirinin üzerine yanlış anlamla yazılır. Bu yüzden ekip verisi tek kaynaktan (NVS) geliyor.
    blocks: ["mudurluk", "skip", "amirlik", "skip"],
    matchSignal: { cellText: "MÜDÜRLÜK BAZLI (ARISTO HARİÇ)" },
  },
];
