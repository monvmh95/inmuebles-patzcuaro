import { NextResponse } from "next/server";
import { KING_ENABLED } from "@/lib/config";

export const runtime = "nodejs";

// Fase 2: aquí se crea la preferencia de Mercado Pago (Checkout Pro) y el turno del Rey
// se agenda ÚNICAMENTE desde el webhook firmado (ver lib/king.ts -> scheduleKing).
export async function POST() {
  if (!KING_ENABLED) {
    return NextResponse.json({ error: "El Rey del día estará disponible pronto." }, { status: 404 });
  }
  return NextResponse.json({ error: "Falta conectar Mercado Pago." }, { status: 501 });
}
