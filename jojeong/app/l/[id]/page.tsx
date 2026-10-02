import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getShare } from "@/lib/store";

// The short address a friend is sent ("친구에게 보내기"): it leads on to the signed address it stands for, where the
// result and the preview image are (app/s/[kind]/[token]). A chat app follows the redirect to read the preview.
export const metadata: Metadata = { robots: { index: false } };

export default async function ShortShare({ params }: PageProps<"/l/[id]">) {
  const path = await getShare((await params).id).catch(() => null);
  if (!path) notFound();
  redirect(path);
}
