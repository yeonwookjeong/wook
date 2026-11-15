import { noteSiteError } from "@/lib/store";

// Errors that happen in the browser (the error screen sends them once; app/error.tsx). Server errors are kept by
// instrumentation.ts, so a report that carries a server digest is not taken twice.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { path?: unknown; message?: unknown };
    const path = typeof body.path === "string" ? body.path : "/";
    const message = typeof body.message === "string" ? body.message : "";
    if (!message || message.length > 2000 || path.length > 500) return new Response(null, { status: 204 });
    await noteSiteError({ kind: "client", message, path });
  } catch {}
  return new Response(null, { status: 204 });
}
