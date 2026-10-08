"use server";

import { refresh } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { syncThreads } from "@/lib/threads";

// "지금 가져오기": the daily fetch, run now (the first time, or to see tonight's post). Owner only.
export async function syncThreadsAction(): Promise<string> {
  if (!(await isAdmin())) return "관리자로 로그인해 주세요.";
  try {
    const r = await syncThreads();
    refresh();
    return `글 ${r.posts}개를 확인했어요 (새 글 ${r.fresh}개).`;
  } catch (e) {
    return `가져오지 못했어요: ${(e as Error).message}`;
  }
}
