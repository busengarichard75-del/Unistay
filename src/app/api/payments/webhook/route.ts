
import { POST as ontechWebhook } from "@/app/api/payments/ontech/webhook/route";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return ontechWebhook(request);
}
