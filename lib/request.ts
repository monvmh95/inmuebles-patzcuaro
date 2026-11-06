import { sha256 } from "./util";

export function clientIpHash(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return sha256(`${fwd}|${process.env.SESSION_SECRET || "inm"}`);
}
