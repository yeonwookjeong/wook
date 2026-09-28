"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { isAdmin, signIn, signOut } from "@/lib/admin";
import { deleteInquiry, setInquiryDone } from "@/lib/store";

export async function adminSignIn(_prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  if (!(await signIn(String(formData.get("password") ?? "")))) return { error: "비밀번호가 맞지 않아요." };
  redirect("/admin");
}

export async function adminSignOut() {
  await signOut();
  redirect("/");
}

// The inbox: mark a question answered (or open again), or delete it. Owner only.
export async function inquiryDoneAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await setInquiryDone(String(formData.get("id") ?? ""), formData.get("done") === "1");
  refresh();
}

export async function inquiryDeleteAction(formData: FormData) {
  if (!(await isAdmin())) return;
  await deleteInquiry(String(formData.get("id") ?? ""));
  refresh();
}
