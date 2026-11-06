import { NextResponse } from "next/server";
import { getSession, isTelKey } from "@/lib/account";
import { mailEnabled } from "@/lib/mail";
import { smsEnabled } from "@/lib/sms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const channel = smsEnabled() ? "sms" : mailEnabled() ? "email" : null;
  const s = channel ? await getSession().catch(() => null) : null;
  return NextResponse.json({ enabled: Boolean(channel), channel, email: s?.email ?? null, whatsapp: s?.whatsapp ?? null, owner_kind: s?.owner_kind ?? null, tel: s ? isTelKey(s.email_norm) : false }, { headers: { "cache-control": "no-store" } });
}
