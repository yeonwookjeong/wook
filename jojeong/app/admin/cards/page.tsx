import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { Card } from "./Card";

export const metadata: Metadata = { title: "카드", robots: { index: false } };

// One social card per URL (?c=…), full size, so a screenshot of the page is the image. Owner only.
export default async function Cards({ searchParams }: PageProps<"/admin/cards">) {
  if (!(await isAdmin())) redirect("/admin");
  return <Card q={await searchParams} />;
}
