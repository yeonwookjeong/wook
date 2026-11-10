"use server";

import { personToken, type EnPersonInput } from "@/lib/en/person";

export type { EnPersonInput };

export async function makeReading(people: EnPersonInput[]): Promise<{ tokens: string[] } | { error: string }> {
  if (!Array.isArray(people) || people.length < 1 || people.length > 2) return { error: "Please fill in the form again." };
  try {
    return { tokens: people.map((p, i) => personToken(p, people.length === 2 ? (i === 0 ? "You" : "Your partner") : "You")) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong. Please try again." };
  }
}
