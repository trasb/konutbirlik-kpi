import { SeparateSheetsFamilySpec } from "./generic-separate-sheets";
import { MultiBlockFamilySpec } from "./generic-multi-block";
import { RawHamdataSpec } from "./raw-hamdata";

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

/**
 * Bazı dosya aileleri, özet sayfalarının yanında ham (işemri bazlı) bir Hamdata sayfası da
 * içeriyor. Bu sayfalardan sadece KONUTBİRLİK'e ait satırlar çekilip süre dağılımı / "kaç
 * tanesi süresinde, geç kalanlar ne kadar geç kaldı" gibi detaylı analizler için saklanıyor
 * (bkz. src/lib/parsing/raw-hamdata.ts). Anahtar, SEPARATE_SHEETS_FAMILIES veya
 * MULTI_BLOCK_FAMILIES içindeki "id" alanıyla eşleşir.
 *
 * Eşik (esikSaat) değerleri sadece Hamdata Kılavuz sayfasında açıkça yazılı olduğu yerlerde
 * kullanıldı (T4, T70, T7: "X günde tamamlanan"). Açık bir eşik bulunamayan kolonlar için
 * (örn. T29) süre kaydediliyor ama "uyumlu" alanı bilinmiyor (null) bırakılıyor — yanlış bir
 * eşik varsayıp hatalı "geç kaldı" etiketi koymaktansa eksik bırakmak daha güvenli.
 */
export const RAW_HAMDATA_BY_FAMILY: Record<string, RawHamdataSpec[]> = {
  T4_5_7_70: [
    {
      sheetName: "T4-İnt. Kurulum Süre Uyum Hamda",
      kpiCode: "T4_KURULUM_SURE_UYUM",
      mode: "directDuration",
      sureHeaders: ["Tamamlanma Süresi (Saat)"],
      uyumluHeaders: ["Kurulum Süresine Uyum"],
    },
    {
      sheetName: "T70-Ses Kurulum Süre Uyum Hamda",
      kpiCode: "T70_SES_KURULUM_SURE_UYUM",
      mode: "directDuration",
      sureHeaders: ["Tamamlanma Süresi (Saat)"],
      esikSaat: 72, // Hamdata Kılavuz: "3 günde tamamlanan" = 72 saat altı
    },
    {
      sheetName: "T7 TV Süre Uyum Hamdata",
      kpiCode: "T7_IPTV_KURULUM_SURE_UYUM",
      mode: "directDuration",
      sureHeaders: ["Isemri Tamamlanma -Bildirim"],
      esikSaat: 72,
    },
    {
      sheetName: "T29-Dönüşüm Uyum Hamdata",
      kpiCode: "T29_DONUSUM_SURE_UYUM",
      mode: "dateDiff",
      startHeaders: ["İşemri Başvuru Tarihi (DD.MM.YYYY HH:MM:SS)"],
      endHeaders: ["İşemri Tamamlanma Tarihi (DD.MM.YYYY HH:MM:SS)"],
      // Kılavuzda T29 için açık bir saat eşiği yok — süre kaydedilir, uyum bilinmiyor sayılır.
    },
  ],
  INTERNET_ARIZA_RANDEVU: [
    {
      sheetName: "İnt. Arıza Randevuya Uyum Hamda",
      kpiCode: "T13_INTERNET_ARIZA_RANDEVU",
      mode: "directDuration",
      sureHeaders: [],
      uyumluHeaders: ["Slot Bazlı Randevuya Uyum"],
    },
  ],
  T19_99: [
    {
      sheetName: "T19 - İlk Randevu - İnt. Hamdat",
      kpiCode: "T19_ILK_RANDEVU_UYUM",
      mode: "directDuration",
      sureHeaders: ["İlk Randevu - Tamamlanma Zamanı (Saat)"],
      uyumluHeaders: ["+24 saate uyumlu mu?"],
    },
    {
      sheetName: "T99-TV Randevuya Uyum Hamdata",
      kpiCode: "T99_TV_RANDEVU_UYUM",
      mode: "directDuration",
      sureHeaders: [],
      uyumluHeaders: ["Slot Bazlı Ajanda Bitiş - İşemri Tamamlanma Uyum"],
    },
  ],
  T27_30: [
    {
      sheetName: "T27-IPTV Kurulum Hamdata",
      kpiCode: "T27_IPTV_KURULUM_TAMAMLANMA",
      mode: "numericThreshold",
      valueHeaders: ["Başvuru Aşama Kodu"],
      threshold: 6,
      comparison: "gte",
    },
    {
      sheetName: "T30-DTH Kurulum Hamdata",
      kpiCode: "T30_DTH_KURULUM_TAMAMLANMA",
      mode: "successText",
      valueHeaders: ["Isemri Durumu"],
      successValues: ["Tamamlandı"],
    },
  ],
  T34: [
    {
      sheetName: "T34-IPTV Tekrar Arıza Hamdata",
      kpiCode: "T34_IPTV_TEKRAR_ARIZA",
      mode: "numericThreshold",
      valueHeaders: ["Tekrar Eden Arıza Sayısı"],
      threshold: 0,
      comparison: "lte",
    },
  ],
  T37_38: [
    {
      sheetName: "T37- Kronik Arıza Hamdata",
      kpiCode: "T37_KRONIK_ARIZA",
      mode: "successText",
      valueHeaders: ["Mars Kronik Arıza mı?"],
      successValues: ["H"], // H=Hayır (kronik değil) = başarılı
    },
  ],
  TEYITTEN_DONEN: [
    {
      sheetName: "Hamdata",
      kpiCode: "TEYITTEN_DONME",
      mode: "successText",
      valueHeaders: ["Teyitten Dondu Mu"],
      successValues: ["false"],
    },
  ],
  T41_43: [
    {
      sheetName: "T41-DSL Arıza Port Testi Hamdat",
      kpiCode: "T41_DSL_PORT_TESTI",
      mode: "successText",
      valueHeaders: ["Port Testi Sonucu"],
      successValues: ["OLUMLU"],
    },
    {
      sheetName: "T41-DSL Kurulum Port Testi Hamd",
      kpiCode: "T41_DSL_PORT_TESTI",
      mode: "successText",
      valueHeaders: ["Port Fiziksel Hat Test Sonucu"],
      successValues: ["OLUMLU"],
    },
    {
      sheetName: "T43-FTTH Arıza Port Testi Hamda",
      kpiCode: "T43_FTTH_PORT_TESTI",
      mode: "successText",
      valueHeaders: ["Ftth Port Test Sonucu"],
      successValues: ["OLUMLU"],
    },
    {
      sheetName: "T43-FTTH Kurulum Port Testi Ham",
      kpiCode: "T43_FTTH_PORT_TESTI",
      mode: "successText",
      valueHeaders: ["Ftth Port Test Sonucu"],
      successValues: ["OLUMLU"],
    },
  ],
  T25_STANDALONE: [
    {
      sheetName: "T25-İnternet Kurulum Hamdata",
      kpiCode: "T25_KURULUM_TAMAMLANMA",
      mode: "successText",
      valueHeaders: ["Başarı Durumu"],
      successValues: ["Başarılı"],
    },
  ],
  T33_STANDALONE: [
    {
      sheetName: "Hamveri (Islah Eden Ekip)",
      kpiCode: "T33_TEKRAR_EDEN_ARIZA",
      mode: "numericThreshold",
      valueHeaders: ["Tekrar Eden Arıza Sayısı"],
      threshold: 0,
      comparison: "lte",
    },
  ],
  T8: [
    {
      sheetName: "Ham Data",
      kpiCode: "T8_DONUSUM_TAMAMLANMA",
      mode: "successText",
      valueHeaders: ["Isemri Durumu"],
      successValues: ["Tamamlandı"],
    },
  ],
  T18: [
    {
      sheetName: "Hamdata",
      kpiCode: "T18_BASARILI_ELITT",
      mode: "successText",
      valueHeaders: ["İşlem Sonuç Kodu Adı"],
      successValues: ["EV İÇİ DESTEK HİZMETİ BAŞARILI"],
    },
  ],
};
