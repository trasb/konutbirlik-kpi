"use server";

import { db } from "@/db";
import { goals } from "@/db/schema";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateGoal(formData: FormData) {
  const kpiCode = String(formData.get("kpiCode") ?? "");
  const rawValue = String(formData.get("targetValue") ?? "").trim();
  if (!kpiCode) return;

  if (rawValue === "") {
    await db.delete(goals).where(sql`${goals.kpiCode} = ${kpiCode}`);
  } else {
    const value = Number(rawValue.replace(",", "."));
    if (!Number.isFinite(value)) return;
    await db
      .insert(goals)
      .values({ kpiCode, targetValue: String(value) })
      .onConflictDoUpdate({
        target: goals.kpiCode,
        set: { targetValue: String(value), updatedAt: sql`now()` },
      });
  }

  revalidatePath("/hedefler");
  revalidatePath("/");
}
