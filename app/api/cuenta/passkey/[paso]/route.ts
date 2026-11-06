import { NextResponse } from "next/server";
import {
  generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { getSession, startSessionFor } from "@/lib/account";
import { query } from "@/lib/db";
import { RP_NAME, rpID, rpOrigin, setChallenge, takeChallenge } from "@/lib/passkey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: { "cache-control": "no-store" } });
type Row = { id: string; email_norm: string; public_key: string; counter: string | number; transports: string | null };

export async function POST(req: Request, ctx: { params: Promise<{ paso: string }> }) {
  const { paso } = await ctx.params;
  try {
    // 1) Registrar una llave: solo con sesión iniciada (ya verificada por SMS).
    if (paso === "registro-opciones" || paso === "registro") {
      const s = await getSession();
      if (!s) return fail("Primero inicia sesión con el código.", 401);
      if (paso === "registro-opciones") {
        const existing = await query<{ id: string }>(`SELECT id FROM passkeys WHERE email_norm = $1`, [s.email_norm]);
        if (existing.length >= 5) return fail("Ya tienes varios dispositivos registrados.");
        const opts = await generateRegistrationOptions({
          rpName: RP_NAME, rpID: rpID(), userName: s.email, userDisplayName: s.email,
          userID: new TextEncoder().encode(s.email_norm), attestationType: "none",
          excludeCredentials: existing.map((e) => ({ id: e.id })),
          authenticatorSelection: { residentKey: "required", userVerification: "required" },
        });
        await setChallenge(opts.challenge, "reg", s.email_norm);
        return NextResponse.json(opts, { headers: { "cache-control": "no-store" } });
      }
      const expected = await takeChallenge("reg", s.email_norm);
      if (!expected) return fail("La solicitud venció. Intenta de nuevo.");
      const body = await req.json().catch(() => null);
      const v = await verifyRegistrationResponse({ response: body, expectedChallenge: expected, expectedOrigin: rpOrigin(), expectedRPID: rpID(), requireUserVerification: true });
      if (!v.verified || !v.registrationInfo) return fail("No pudimos registrar este dispositivo.");
      const c = v.registrationInfo.credential;
      await query(
        `INSERT INTO passkeys (id, email_norm, public_key, counter, transports) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [c.id, s.email_norm, Buffer.from(c.publicKey).toString("base64url"), c.counter, (c.transports ?? []).join(",")],
      );
      return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    }

    // 2) Entrar con una llave (sin escribir el número).
    if (paso === "entrar-opciones") {
      const opts = await generateAuthenticationOptions({ rpID: rpID(), userVerification: "required" });
      await setChallenge(opts.challenge, "auth");
      return NextResponse.json(opts, { headers: { "cache-control": "no-store" } });
    }
    if (paso === "entrar") {
      const expected = await takeChallenge("auth");
      if (!expected) return fail("La solicitud venció. Intenta de nuevo.");
      const body = await req.json().catch(() => null);
      const id = typeof body?.id === "string" ? body.id : "";
      const rows = await query<Row>(`SELECT id, email_norm, public_key, counter, transports FROM passkeys WHERE id = $1`, [id]);
      const r = rows[0];
      if (!r) return fail("Este dispositivo no está registrado. Entra con el código por SMS.", 404);
      const v = await verifyAuthenticationResponse({
        response: body, expectedChallenge: expected, expectedOrigin: rpOrigin(), expectedRPID: rpID(), requireUserVerification: true,
        credential: { id: r.id, publicKey: Buffer.from(r.public_key, "base64url"), counter: Number(r.counter), transports: (r.transports ? r.transports.split(",") : undefined) as AuthenticatorTransportFuture[] | undefined },
      });
      if (!v.verified) return fail("No pudimos verificar tu huella o rostro.", 401);
      await query(`UPDATE passkeys SET counter = $2, last_used_at = now() WHERE id = $1`, [r.id, v.authenticationInfo.newCounter]);
      const acc = await startSessionFor(r.email_norm);
      if (!acc) return fail("Cuenta no encontrada.", 404);
      return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    }
  } catch (e) {
    console.error("passkey:", paso, e);
    return fail("No se pudo completar. Intenta de nuevo o entra con el código por SMS.", 400);
  }
  return fail("No encontrado", 404);
}
