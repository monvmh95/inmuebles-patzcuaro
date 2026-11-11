import { listEditions, pickEdition } from "@/lib/events";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { safe } from "@/lib/safe";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);
const d8 = (d: string) => d.replace(/-/g, "");
function nextDay(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + 1)).toISOString().slice(0, 10).replace(/-/g, "");
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = pickEdition(await safe(() => listEditions(slug), []));
  if (!ev) return new Response("No encontrado", { status: 404 });
  const url = `${SITE_URL}/eventos/${ev.series}`;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${SITE_NAME}//Eventos//ES`, "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${ev.series}-${ev.year}@${new URL(SITE_URL).hostname}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
    `DTSTART;VALUE=DATE:${d8(ev.starts_on)}`, `DTEND;VALUE=DATE:${nextDay(ev.ends_on)}`,
    `SUMMARY:${esc(ev.title)}`, `LOCATION:${esc([ev.venue, ev.city].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc(`${ev.summary}\nMás información: ${url}`)}`, `URL:${url}`, "END:VEVENT", "END:VCALENDAR",
  ];
  return new Response(lines.join("\r\n") + "\r\n", { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${ev.series}.ics"` } });
}
