// The printer box signs in with a secret key, made on the Customize page. Only a hash of the key is stored.
import { createHash, randomBytes } from "node:crypto";
import { admin } from "../supabase/admin.ts";

// A paper not printed within this long after its print time is skipped.
export const PRINT_WINDOW_MS = 60 * 60 * 1000;

const hashOf = (key: string) => createHash("sha256").update(key).digest("hex");

export function newPrinterKey() {
  const key = `dp_${randomBytes(24).toString("base64url")}`;
  return { key, hash: hashOf(key) };
}

// The reader whose printer box sent this request, from its "Authorization: Bearer <key>" header. Notes when it was
// last seen, so the Customize page can show whether the box is online. Null for a missing or wrong key.
export async function printerOwner(request: Request) {
  const key = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!key) return null;
  const { data } = await admin()
    .from("printers")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("key_hash", hashOf(key))
    .select("user_id")
    .maybeSingle();
  return data?.user_id ?? null;
}
