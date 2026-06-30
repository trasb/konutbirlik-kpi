export type ColorStyle = { backgroundColor: string; color: string };

/** index=0 (en başarılı) yeşil, index=total-1 (en başarısız) kırmızı olacak şekilde gradyan üretir. */
export function rankColor(index: number, total: number): ColorStyle {
  if (total <= 1) return { backgroundColor: "hsl(80 70% 94%)", color: "hsl(80 70% 25%)" };
  const t = index / (total - 1); // 0..1
  const hue = 120 * (1 - t); // 120=yeşil, 0=kırmızı
  return { backgroundColor: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 70% 25%)` };
}

/** 1-5 arası bir skoru (NVS skor sistemi) doğrudan renge çevirir: 1=kırmızı, 5=yeşil. */
export function scoreColor(skor: number | null): ColorStyle | undefined {
  if (skor === null) return undefined;
  const hue = Math.max(0, Math.min(1, (skor - 1) / 4)) * 120;
  return { backgroundColor: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 70% 25%)` };
}

/**
 * Bir değeri hedefiyle kıyaslayıp renklendirir: hedefi tutturan/aşan tamamen yeşil,
 * tutturamayanlar hedeften ne kadar uzaksa o kadar kırmızıya kayar.
 */
// Hedefin bu kadar (göreli) altında/üstünde kalan değer tamamen kırmızı kabul edilir.
// Küçük sapmalarda bile fark edilir bir renk değişimi olsun diye dar tutuluyor.
const BADNESS_SPAN = 0.3;

export function targetColor(
  value: number | null,
  target: number | null,
  direction: "higher_better" | "lower_better" | null | undefined,
): ColorStyle | undefined {
  if (value === null || target === null || !direction) return undefined;
  if (target === 0) return undefined; // göreli sapma tanımsız

  const relMiss =
    direction === "higher_better" ? (target - value) / target : (value - target) / target;

  if (relMiss <= 0) return { backgroundColor: "hsl(120 70% 94%)", color: "hsl(120 70% 25%)" };

  const p = Math.max(0, 1 - relMiss / BADNESS_SPAN);
  const hue = 120 * p;
  return { backgroundColor: `hsl(${hue} 70% 94%)`, color: `hsl(${hue} 70% 25%)` };
}
