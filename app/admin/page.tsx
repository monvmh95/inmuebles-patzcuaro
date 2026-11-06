import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { hasDb, query } from "@/lib/db";
import { FREE_LISTING_LIMIT, KING_ENABLED, OPERATIONS, TYPES } from "@/lib/config";
import { listPublishers, limitFor } from "@/lib/publishers";
import { formatDate, formatPrice } from "@/lib/util";
import { saveColonia } from "./actions";
import { listColoniaContent } from "@/lib/colonias";
import { approve, archive, verify, unverify, grantKing, login, logout, reject, resolveReport, setPrice, savePublisher, handleSuggestion, deleteAllListings, openTestSession } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

type Row = {
  verified_at?: string | null;
  id: number; slug: string; title: string; description: string; operation: keyof typeof OPERATIONS; type: keyof typeof TYPES;
  price: number | null; colonia: string; whatsapp: string; email: string | null; photos: string[]; status: string;
  views: number; wa_clicks: number; created_at: string; confirmed_at: string; owner_kind: string;
};

export default async function Admin({ searchParams }: { searchParams?: Promise<{ borrado?: string; sesion?: string; acceso?: string }> }) {
  const sp = await searchParams;
  const borrado = sp?.borrado;
  if (!adminConfigured()) {
    return (
      <div className="notice">
        <h1>Administración</h1>
        {sp?.acceso === "bloqueado" && <p className="error" role="alert">Demasiados intentos. Espera 15 minutos.</p>}
        <p>Falta definir la variable <code>ADMIN_PASSWORD</code> en Vercel (Settings → Environment Variables) y volver a desplegar.</p>
      </div>
    );
  }
  if (!(await isAdmin())) {
    return (
      <form action={login} className="form" style={{ maxWidth: 380 }}>
        <h1>Administración</h1>
        <label>Contraseña<input name="password" type="password" required autoFocus autoComplete="current-password" /></label>
        <button className="btn">Entrar</button>
      </form>
    );
  }
  if (!hasDb()) {
    return <div className="notice"><h1>Administración</h1><p>Conecta la base de datos (Neon) para empezar a moderar.</p><form action={logout}><button className="btn btn-small">Salir</button></form></div>;
  }

  const suggestions = await query<{ id: number; kind: string; message: string; contact: string | null; created_at: string }>(`SELECT id, kind, message, contact, created_at FROM suggestions WHERE NOT handled ORDER BY id DESC LIMIT 40`).catch(() => []);
  const [pending, approved, reports, stats, slots, colContent, colList, people] = await Promise.all([
    query<Row>(`SELECT * FROM properties WHERE status='pending' ORDER BY id ASC LIMIT 50`),
    query<Row>(`SELECT * FROM properties WHERE status='approved' ORDER BY approved_at DESC NULLS LAST LIMIT 40`),
    query<{ id: number; reason: string; created_at: string; slug: string; title: string }>(
      `SELECT r.id, r.reason, r.created_at, p.slug, p.title FROM reports r JOIN properties p ON p.id=r.property_id WHERE NOT r.resolved ORDER BY r.id DESC LIMIT 30`),
    query<{ status: string; total: number; views: number; clicks: number }>(
      `SELECT status, COUNT(*)::int AS total, COALESCE(SUM(views),0)::int AS views, COALESCE(SUM(wa_clicks),0)::int AS clicks FROM properties GROUP BY status`),
    query<{ title: string; starts_at: string; ends_at: string; source: string }>(
      `SELECT p.title, k.starts_at, k.ends_at, k.source FROM king_slots k JOIN properties p ON p.id=k.property_id WHERE k.ends_at > now() ORDER BY k.starts_at LIMIT 20`),
    listColoniaContent(),
    query<{ colonia: string; colonia_slug: string }>(`SELECT MIN(colonia) AS colonia, colonia_slug FROM properties GROUP BY colonia_slug ORDER BY colonia_slug`),
    listPublishers(),
  ]);
  const countByPhone = new Map(people.map((x) => [x.whatsapp, x.active]));
  const contentBySlug = new Map(colContent.map((c) => [c.colonia_slug, c]));
  const coloniaRows = [...new Map([...colList.map((c) => [c.colonia_slug, { slug: c.colonia_slug, name: c.colonia }] as const), ...colContent.map((c) => [c.colonia_slug, { slug: c.colonia_slug, name: c.name }] as const)]).values()];
  const by = Object.fromEntries(stats.map((s) => [s.status, s]));
  const totalViews = stats.reduce((a, s) => a + s.views, 0);
  const totalClicks = stats.reduce((a, s) => a + s.clicks, 0);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Administración</h1>
        <form action={logout}><button className="btn btn-small btn-ghost">Salir</button></form>
      </div>

      <div className="stats">
        <div className="stat"><b>{by.pending?.total ?? 0}</b>por revisar</div>
        <div className="stat"><b>{by.approved?.total ?? 0}</b>publicadas</div>
        <div className="stat"><b>{totalViews}</b>visitas totales</div>
        <div className="stat"><b>{totalClicks}</b>clics a WhatsApp</div>
        <div className="stat"><b>{reports.length}</b>reportes abiertos</div>
      </div>
      <p className="muted small">
        Rey del día: {KING_ENABLED ? "ACTIVO" : "apagado (ENABLE_KING=false)"} · Fotos: {process.env.BLOB_READ_WRITE_TOKEN ? "conectadas" : "sin configurar"}.
        Umbral sugerido para activar el Rey: ~50 propiedades, ~1,000 visitas/mes, ~100 clics a WhatsApp/mes.
      </p>

      <section>
        <h2>Por revisar ({pending.length})</h2>
        {pending.length === 0 && <p className="muted">Nada pendiente.</p>}
        {pending.map((p) => (
          <div className="admin-item" key={p.id}>
            <div className="admin-photos">
              {p.photos.slice(0, 6).map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <a key={u} href={u} target="_blank" rel="noopener"><img src={u} alt="" loading="lazy" /></a>
              ))}
              {p.photos.length === 0 && <span className="muted small">Sin fotos</span>}
            </div>
            <div className="stack">
              <strong>{p.title}</strong>
              <div className="small muted">{OPERATIONS[p.operation].label} · {TYPES[p.type].label} · {p.colonia} · {formatPrice(p.price, p.operation)} · {p.owner_kind === "dueno" ? "dueño" : "agente"}</div>
              <div className="small">WhatsApp: <a href={`https://wa.me/52${p.whatsapp}`} target="_blank" rel="noopener">{p.whatsapp}</a>{p.email ? ` · ${p.email}` : ""} · {formatDate(p.created_at)} · <strong>{countByPhone.get(p.whatsapp) ?? 1} anuncio(s) activos de esta persona</strong></div>
              <p className="small" style={{ whiteSpace: "pre-line", margin: 0 }}>{p.description}</p>
              <div className="row">
                <form action={approve}><input type="hidden" name="id" value={p.id} /><button className="btn btn-small">Aprobar</button></form>
                <form action={reject}><input type="hidden" name="id" value={p.id} /><button className="btn btn-small btn-ghost">Rechazar</button></form>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Personas que publican ({people.length})</h2>
        <p className="muted small">
          Se identifican por su WhatsApp o su correo: cambiar solo uno no evade el límite. Límite gratuito por defecto: <strong>{FREE_LISTING_LIMIT}</strong> anuncios activos (por revisar + publicados); se cambia con la variable <code>FREE_LISTING_LIMIT</code>.
          Aquí puedes darle a una persona un límite propio (por ejemplo, un agente que pagó un plan), bloquear un número o dejar una nota. Un límite vacío usa el predeterminado.
        </p>
        <table className="table">
          <thead><tr><th>WhatsApp</th><th>Activos</th><th>Total</th><th>Último</th><th>Límite propio</th><th>Nota</th><th></th></tr></thead>
          <tbody>
            {people.map((x) => (
              <tr key={x.whatsapp} style={x.blocked ? { opacity: 0.6 } : undefined}>
                <td data-label="WhatsApp"><a href={`https://wa.me/52${x.whatsapp}`} target="_blank" rel="noopener">{x.whatsapp}</a>{x.emails ? <><br /><span className="muted small">{x.emails}</span></> : null}</td>
                <td data-label="Activos"><strong>{x.active}</strong> / {limitFor(x)}<br /><span className="muted small">{x.pending} por revisar · {x.approved} publicados</span></td>
                <td data-label="Total">{x.total}</td>
                <td className="small" data-label="Último">{formatDate(x.last_at)}</td>
                <td colSpan={3} data-label="Límite y nota">
                  <form action={savePublisher} className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                    <input type="hidden" name="whatsapp" value={x.whatsapp} />
                    <input name="limit" defaultValue={x.listing_limit ?? ""} inputMode="numeric" placeholder={String(FREE_LISTING_LIMIT)} aria-label="Límite propio" style={{ width: 70, padding: "6px 8px" }} />
                    <input name="note" defaultValue={x.note ?? ""} placeholder="Nota (agente, plan, etc.)" maxLength={300} style={{ width: 180, padding: "6px 8px" }} />
                    <label className="check" style={{ gap: 4 }}><input type="checkbox" name="blocked" defaultChecked={x.blocked} /> Bloqueado</label>
                    <button className="btn btn-small btn-ghost">Guardar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Sugerencias y dudas ({suggestions.length})</h2>
        {suggestions.length === 0 && <p className="muted">Sin mensajes nuevos.</p>}
        {suggestions.map((x) => (
          <div className="admin-item" key={x.id} style={{ gridTemplateColumns: "1fr" }}>
            <div><strong>{x.kind}</strong> <span className="muted small">· {formatDate(x.created_at)}{x.contact ? ` · ${x.contact}` : ""}</span><p className="small" style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>{x.message}</p></div>
            <div className="row"><form action={handleSuggestion}><input type="hidden" name="id" value={x.id} /><button className="btn btn-small btn-ghost">Marcar leído</button></form></div>
          </div>
        ))}
      </section>

      <section>
        <h2>Reportes ({reports.length})</h2>
        {reports.length === 0 && <p className="muted">Sin reportes abiertos.</p>}
        {reports.map((r) => (
          <div className="admin-item" key={r.id} style={{ gridTemplateColumns: "1fr" }}>
            <div><a href={`/propiedad/${r.slug}`} target="_blank">{r.title}</a> <span className="muted small">· {formatDate(r.created_at)}</span><p className="small" style={{ margin: "4px 0" }}>{r.reason}</p></div>
            <div className="row">
              <form action={resolveReport}><input type="hidden" name="id" value={r.id} /><button className="btn btn-small btn-ghost">Marcar resuelto</button></form>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Publicadas</h2>
        <table className="table">
          <thead><tr><th>Anuncio</th><th>Precio</th><th>Visitas</th><th>WhatsApp</th><th>Vence</th><th></th></tr></thead>
          <tbody>
            {approved.map((p) => (
              <tr key={p.id}>
                <td data-label="Anuncio"><a href={`/propiedad/${p.slug}`} target="_blank">{p.title}</a><br /><span className="muted small">{p.colonia}</span></td>
                <td data-label="Precio">
                  <form action={setPrice} className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                    <input type="hidden" name="id" value={p.id} />
                    <input name="price" defaultValue={p.price ?? ""} inputMode="numeric" aria-label="Precio" style={{ width: 110, padding: "6px 8px" }} />
                    <button className="btn btn-small btn-ghost" title={`Ahora: ${formatPrice(p.price, p.operation)}`}>Guardar</button>
                  </form>
                  <span className="muted small">{formatPrice(p.price, p.operation)}</span>
                </td>
                <td data-label="Visitas">{p.views}</td><td data-label="Clics WhatsApp">{p.wa_clicks}</td>
                <td data-label="Vence">{formatDate(new Date(new Date(p.confirmed_at).getTime() + 90 * 86_400_000))}</td>
                <td className="row">
                  {p.verified_at ? (
                    <form action={unverify}><input type="hidden" name="id" value={p.id} /><button className="btn btn-small btn-ghost" title="Quitar el sello">Quitar ✓</button></form>
                  ) : (
                    <form action={verify}><input type="hidden" name="id" value={p.id} /><button className="btn btn-small btn-ghost" title="Solo si ya cumpliste los criterios de /verificacion">Verificar ✓</button></form>
                  )}
                  <form action={archive}><input type="hidden" name="id" value={p.id} /><button className="btn btn-small btn-ghost">Dar de baja</button></form>
                  <form action={grantKing}><input type="hidden" name="id" value={p.id} /><button className="btn btn-small btn-ghost" title="Prueba interna, sin cobro">Probar Rey</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Textos de colonias</h2>
        <p className="muted small">Escribe tú el texto (mínimo ~80 caracteres) de cada colonia que conozcas. Sin texto la página no se indexa en Google. Separa párrafos con una línea en blanco; solo escribe lo que te conste.</p>
        {coloniaRows.map((c) => {
          const ct = contentBySlug.get(c.slug);
          return (
            <details key={c.slug} className="faq" style={{ marginBottom: 8 }}>
              <summary>{c.name} {ct && ct.intro.trim().length >= 80 ? "✓" : "(sin texto)"}</summary>
              <form action={saveColonia} className="form" style={{ marginTop: 10 }}>
                <input type="hidden" name="slug" value={c.slug} />
                <label>Nombre<input name="name" defaultValue={c.name} required maxLength={60} /></label>
                <label>Texto<textarea name="intro" rows={7} maxLength={4000} defaultValue={ct?.intro ?? ""} /></label>
                <button className="btn btn-small">Guardar</button>
              </form>
            </details>
          );
        })}
        <details className="faq">
          <summary>+ Agregar otra colonia</summary>
          <form action={saveColonia} className="form" style={{ marginTop: 10 }}>
            <label>Nombre<input name="name" required maxLength={60} /></label>
            <label>Texto<textarea name="intro" rows={7} maxLength={4000} /></label>
            <button className="btn btn-small">Guardar</button>
          </form>
        </details>
      </section>

      <section>
        <h2>Entrar sin SMS (pruebas)</h2>
        {sp?.sesion === "invalida" && <p className="error" role="alert">Escribe un celular de 10 dígitos.</p>}
        <p className="muted small" style={{ maxWidth: 560 }}>Abre en este navegador una sesión de cuenta para ese celular, como si lo hubieras verificado por SMS, sin gastar créditos. Úsalo para probar publicar y el calendario. Solo funciona estando dentro del panel de administración.</p>
        <form action={openTestSession} className="form stack" style={{ maxWidth: 420 }}>
          <label>Celular de la cuenta (10 dígitos)<input name="phone" inputMode="tel" required placeholder="434 123 4567" /></label>
          <button className="btn btn-small">Entrar y abrir Publicar</button>
        </form>
      </section>

      <section>
        <h2>Borrar anuncios de prueba</h2>
        {borrado && <p className="ok" role="status">{borrado === "cancelado" ? "No se borró nada (no escribiste BORRAR)." : `Se borraron ${borrado} anuncios y sus fotos.`}</p>}
        <details>
          <summary>Borrar TODOS los anuncios</summary>
          <form action={deleteAllListings} className="form stack" style={{ maxWidth: 420 }}>
            <p className="small">Elimina definitivamente todos los anuncios (pendientes, publicados y dados de baja) con sus fotos y reportes. No se puede deshacer. Las cuentas, sesiones y límites de personas se conservan.</p>
            <label>Escribe BORRAR para confirmar<input name="confirm" autoComplete="off" required /></label>
            <button className="btn btn-small">Borrar todos los anuncios</button>
          </form>
        </details>
      </section>

      {slots.length > 0 && (
        <section>
          <h2>Cola del Rey</h2>
          <table className="table"><tbody>
            {slots.map((s, i) => <tr key={i}><td>{s.title}</td><td>{formatDate(s.starts_at)} → {formatDate(s.ends_at)}</td><td>{s.source}</td></tr>)}
          </tbody></table>
        </section>
      )}
    </div>
  );
}
