"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentMember, deleteMember, MEMBER_COOKIE } from "@/lib/members";

export async function leaveAction() {
  const member = await currentMember();
  if (member) await deleteMember(member.id);
  (await cookies()).delete(MEMBER_COOKIE);
  redirect("/?left=1");
}
