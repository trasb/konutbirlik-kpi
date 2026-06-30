import { db } from "./index";
import { kpiDefinitions } from "./schema";

type KpiSeed = {
  kpiCode: string;
  name: string;
  direction: "higher_better" | "lower_better";
  unit?: string;
  targetGold: number | null;
  sourceFamily: string;
};

// İsimlerin başındaki "T4 -" gibi önekler sadece kaynak dosyalarda (GidişaTT, NVS Hamdata)
// doğrulanmış T-kodları için kullanılıyor. Doğrulanmamış bir kodu (örn. T13'ü hem Arıza Süre
// Uyum hem de Arıza Randevu Uyum için kullanmak gibi) yanlışlıkla yazmamak için, emin
// olmadığımız KPI'lar (İnternet Arıza Randevu Uyumu, İş Hacmi) önek almıyor.

// NVS (Net Verimlilik Skoru) dosyasının "Skalalar" sayfasındaki 5 puanlık (en üst dilim / Altın) eşikleri.
const NVS_KPIS: KpiSeed[] = [
  { kpiCode: "T13_ARIZA_SURE_UYUM", name: "T13 - Arıza Sürelerine Uyum Oranı", direction: "higher_better", targetGold: 88, sourceFamily: "NVS" },
  { kpiCode: "T41_43_PORT_TESTI", name: "T41/T43 - Başarılı Port Testi Oranı", direction: "higher_better", targetGold: 98, sourceFamily: "NVS" },
  { kpiCode: "T32_EV_ICI_DESTEK", name: "T32 - Ev İçi Destek Oranı", direction: "higher_better", targetGold: 68, sourceFamily: "NVS" },
  { kpiCode: "T32_EV_ICI_TEKRAR", name: "T32 - Ev İçi Destek Tekrar Oranı", direction: "lower_better", targetGold: 5, sourceFamily: "NVS" },
  { kpiCode: "T36_ERKEN_ARIZA", name: "T36 - Erken Arıza Oranı", direction: "lower_better", targetGold: 3, sourceFamily: "NVS" },
  { kpiCode: "IS_HACMI", name: "İş Hacmi Oranı", direction: "higher_better", targetGold: 155, sourceFamily: "NVS" },
  { kpiCode: "T4_KURULUM_SURE_UYUM", name: "T4 - Kurulum Sürelerine Uyum Oranı", direction: "higher_better", targetGold: 91, sourceFamily: "NVS" },
  { kpiCode: "T25_KURULUM_TAMAMLANMA", name: "T25 - Kurulum Tamamlanma Oranı", direction: "higher_better", targetGold: 90, sourceFamily: "NVS" },
  { kpiCode: "T33_TEKRAR_EDEN_ARIZA", name: "T33 - Tekrar Eden Arıza Oranı", direction: "lower_better", targetGold: 4, sourceFamily: "NVS" },
  { kpiCode: "TEYITTEN_DONME", name: "Teyitten Dönme Oranı", direction: "lower_better", targetGold: 7, sourceFamily: "NVS" },
];

// NVS'de yer almayan, ayrı dosyalardan gelecek diğer KPI'lar.
// target_gold şimdilik boş bırakıldı; kullanıcı /hedefler ekranından dolduracak.
const OTHER_KPIS: KpiSeed[] = [
  { kpiCode: "T5_DTH_KURULUM_SURE_UYUM", name: "T5 - DTH Kurulum Sürelerine Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T4_5_7_70" },
  { kpiCode: "T7_IPTV_KURULUM_SURE_UYUM", name: "T7 - IPTV Kurulum Sürelerine Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T4_5_7_70" },
  { kpiCode: "T70_SES_KURULUM_SURE_UYUM", name: "T70 - Ses Kurulum Sürelerine Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T4_5_7_70" },
  { kpiCode: "T29_DONUSUM_SURE_UYUM", name: "T29 - Dönüşüm Kurulum Sürelerine Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T4_5_7_70" },
  { kpiCode: "T8_DONUSUM_TAMAMLANMA", name: "T8 - Başarılı Dönüşüm Oranı (İnternet)", direction: "higher_better", targetGold: null, sourceFamily: "T8" },
  { kpiCode: "T9_BAGLANTI_SURESI", name: "T9 - BTK %95 Bağlantı Süresi (Gün)", direction: "lower_better", unit: "gun", targetGold: null, sourceFamily: "T9" },
  { kpiCode: "T9_ARIZA_SURESI", name: "T9 - BTK %95 Arıza Süresi (Saat)", direction: "lower_better", unit: "saat", targetGold: null, sourceFamily: "T9" },
  { kpiCode: "T9_ENGELLI_ARIZA_SURESI", name: "T9 - BTK %95 Engelli Arıza Süresi (Saat)", direction: "lower_better", unit: "saat", targetGold: null, sourceFamily: "T9" },
  { kpiCode: "T18_BASARILI_ELITT", name: "T18 - Başarılı EliTT Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T18" },
  { kpiCode: "T19_ILK_RANDEVU_UYUM", name: "T19 - İlk Randevu (İnternet) Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T19_99" },
  { kpiCode: "T99_TV_RANDEVU_UYUM", name: "T99 - TV Randevuya Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T19_99" },
  // T-kodu kaynaklarda doğrulanamadı (T13 zaten Arıza Süre Uyum için kullanılıyor) — önek yok.
  { kpiCode: "T13_INTERNET_ARIZA_RANDEVU", name: "İnternet Arıza Randevuya Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "INTERNET_ARIZA_RANDEVU" },
  { kpiCode: "T27_IPTV_KURULUM_TAMAMLANMA", name: "T27 - IPTV Kurulum Tamamlanma Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T27_30" },
  { kpiCode: "T30_DTH_KURULUM_TAMAMLANMA", name: "T30 - DTH Kurulum Tamamlanma Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T27_30" },
  { kpiCode: "T34_IPTV_TEKRAR_ARIZA", name: "T34 - IPTV Tekrar Eden Arıza Oranı", direction: "lower_better", targetGold: null, sourceFamily: "T34" },
  { kpiCode: "T37_KRONIK_ARIZA", name: "T37 - Kronik Arıza Oranı (İnternet)", direction: "lower_better", targetGold: null, sourceFamily: "T37_38" },
  { kpiCode: "T39_IPTV_ERKEN_ARIZA_YS", name: "T39 - IPTV Erken Arıza Oranı (Yeni Satış)", direction: "lower_better", targetGold: null, sourceFamily: "T39" },
  { kpiCode: "T41_DSL_PORT_TESTI", name: "T41 - DSL Port Testi Başarılı Yapılma Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T41_43" },
  { kpiCode: "T43_FTTH_PORT_TESTI", name: "T43 - FTTH Port Testi Başarılı Yapılma Oranı", direction: "higher_better", targetGold: null, sourceFamily: "T41_43" },
  { kpiCode: "T71_SES_ARIZA_SURE_UYUM", name: "T71 - Ses Arıza Giderme Sürelerine Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "GIDISAT_AMIRLIK" },
  { kpiCode: "T16_TV_ARIZA_SURE_UYUM", name: "T16 - TV Arıza Giderme Sürelerine Uyum Oranı", direction: "higher_better", targetGold: null, sourceFamily: "GIDISAT_AMIRLIK" },
  { kpiCode: "T28_DONUSUM_ERKEN_ARIZA", name: "T28 - Dönüşüm Erken Arıza Oranı", direction: "lower_better", targetGold: null, sourceFamily: "GIDISAT_AMIRLIK" },
  { kpiCode: "T95_DSL_MUSTERI_BASINA_ARIZA", name: "T95 - DSL Müşteri Başına Arıza Oranı", direction: "lower_better", targetGold: null, sourceFamily: "GIDISAT_AMIRLIK" },
  { kpiCode: "T96_FTTH_MUSTERI_BASINA_ARIZA", name: "T96 - FTTH Müşteri Başına Arıza Oranı", direction: "lower_better", targetGold: null, sourceFamily: "GIDISAT_AMIRLIK" },
];

async function main() {
  const all = [...NVS_KPIS, ...OTHER_KPIS];
  for (const kpi of all) {
    await db
      .insert(kpiDefinitions)
      .values({
        kpiCode: kpi.kpiCode,
        name: kpi.name,
        direction: kpi.direction,
        unit: kpi.unit ?? "percent",
        targetGold: kpi.targetGold === null ? null : String(kpi.targetGold),
        sourceFamily: kpi.sourceFamily,
      })
      .onConflictDoUpdate({
        target: kpiDefinitions.kpiCode,
        set: {
          name: kpi.name,
          direction: kpi.direction,
          unit: kpi.unit ?? "percent",
          targetGold: kpi.targetGold === null ? null : String(kpi.targetGold),
          sourceFamily: kpi.sourceFamily,
        },
      });
  }
  console.log(`Seeded ${all.length} KPI definitions.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
