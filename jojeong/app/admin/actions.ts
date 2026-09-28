"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/admin";

export async function adminSignIn(_prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  if (!(await signIn(String(formData.get("password") ?? "")))) return { error: "비밀번호가 맞지 않아요." };
  redirect("/admin");
}

export async function adminSignOut() {
  await signOut();
  redirect("/");
}
