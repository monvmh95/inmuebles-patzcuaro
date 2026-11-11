import type { Metadata } from "next";
import EventForm from "@/components/EventForm";
import { getLang, tf } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const t = tf(await getLang());
  return { title: t("Proponer un evento", "Suggest an event"), robots: { index: false, follow: true } };
}

export default async function Enviar() {
  const t = tf(await getLang());
  return (
    <div className="stack">
      <h1>{t("Proponer un evento", "Suggest an event")}</h1>
      <p className="muted" style={{ maxWidth: 560 }}>{t("Compártenos un evento de Pátzcuaro o la región del lago. Lo revisamos y, si está completo, lo publicamos con enlace a su fuente. Es gratis.", "Share an event in Pátzcuaro or the lake region. We review it and, if complete, publish it with a link to its source. It is free.")}</p>
      <EventForm />
    </div>
  );
}
