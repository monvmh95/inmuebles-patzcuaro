import { hasDb } from "./db";

/** Ejecuta una consulta; si la BD no está configurada o falla, regresa el valor de respaldo. */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!hasDb()) return fallback;
  try {
    return await fn();
  } catch (e) {
    console.error("[db]", e instanceof Error ? e.message : e);
    return fallback;
  }
}
