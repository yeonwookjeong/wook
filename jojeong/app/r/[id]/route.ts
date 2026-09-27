import { NextResponse, type NextRequest } from "next/server";
import { getOrder } from "@/lib/pay";

// The buyer's permanent link to a paid report (hundosaju.com/r/…): opens it on any device.
export async function GET(request: NextRequest, { params }: RouteContext<"/r/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.status !== "paid") return NextResponse.redirect(new URL("/my", request.url), 303);
  return NextResponse.redirect(new URL(`/reports/${order.product}?order=${order.id}`, request.url), 303);
}
