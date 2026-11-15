import type { Instrumentation } from "next";

// Every error a page, route or server action throws on the server is kept for the owner's page (lib/store.ts
// noteSiteError), so a broken screen shows up there even when no one writes in. Recording must never add a
// second failure, so anything going wrong here is swallowed.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { noteSiteError } = await import("./lib/store");
    const e = error as { name?: string; message?: string; digest?: string };
    await noteSiteError({
      kind: "server",
      message: `${e.name ?? "Error"}: ${e.message ?? String(error)}`,
      route: `${context.routeType} ${context.routePath}`,
      path: request.path,
      digest: e.digest,
    });
  } catch {}
};
