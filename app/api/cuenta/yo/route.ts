import { NextResponse } from "next/server";
import { getSession } from "@/lib/account";
import { mailEnabled } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = mailEnabled() ? await getSession().catch(() => null) : null;
  return NextResponse.json({ enabled: mailEnabled(), email: s?.email ?? null, whatsapp: s?.whatsapp ?? null, owner_kind: s?.owner_kind ?? null }, { headers: { "cache-control": "no-store" } });
}
