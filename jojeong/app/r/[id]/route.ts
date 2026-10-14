import { NextResponse, type NextRequest } from "next/server";
import { getOrder } from "@/lib/pay";

// The buyer's permanent link to a paid report (hundosaju.com/r/…): opens it on any device.
export async function GET(request: NextRequest, { params }: RouteContext<"/r/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  // A link that leads nowhere says so on 내 보고서 instead of landing there without a word.
  if (!order || order.status !== "paid") return NextResponse.redirect(new URL("/my?missing=1", request.url), 303);
  return NextResponse.redirect(new URL(`/reports/${order.product}?order=${order.id}`, request.url), 303);
}
