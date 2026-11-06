import { NextResponse } from "next/server";
import { getSession, isTelKey, sessionWhy } from "@/lib/account";
import { mailEnabled } from "@/lib/mail";
import { smsEnabled } from "@/lib/sms";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const channel = smsEnabled() ? "sms" : mailEnabled() ? "email" : null;
  let s = null;
  if (channel) {
    try { s = await getSession(); } catch (e) {
      console.error("yo: getSession falló", e);
      return NextResponse.json({ enabled: true, channel, error: true, email: null, whatsapp: null, owner_kind: null, tel: false }, { status: 503, headers: { "cache-control": "no-store" } });
    }
  }
  let passkeys = 0;
  if (s) passkeys = (await query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM passkeys WHERE email_norm = $1`, [s.email_norm]).catch(() => [{ n: 0 }]))[0].n;
  const why = channel ? await sessionWhy().catch(() => "error") : null;
  return NextResponse.json({ enabled: Boolean(channel), channel, why, passkeys, email: s?.email ?? null, whatsapp: s?.whatsapp ?? null, owner_kind: s?.owner_kind ?? null, tel: s ? isTelKey(s.email_norm) : false }, { headers: { "cache-control": "no-store" } });
}
