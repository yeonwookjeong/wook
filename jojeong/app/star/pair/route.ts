import { redirect } from "next/navigation";
import { celebById } from "@/lib/celebs";
import { readMe } from "@/lib/me";
import { encodePerson } from "@/lib/pairToken";

// /star/pair?c=<id>: the reader's saved chart and one famous person, into the 유명인 궁합 report link. The famous
// person is looked up here by id, so the link is built from the list, never from what the browser typed.
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("c"));
  const c = Number.isInteger(id) ? celebById(id) : null;
  const me = await readMe();
  if (!c || !me) redirect("/star");
  const b = encodePerson({ name: c.name, pillars: c.p, gender: null, birthYear: c.year, daeun: [] });
  redirect(`/reports/stargunghap?a=${encodePerson(me.person)}&b=${b}`);
}
