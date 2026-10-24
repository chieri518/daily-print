import { createClient } from "@supabase/supabase-js";

// A Supabase client with full access: for the workflow, and for server-only tables and writes readers can't make
// themselves. Before using it for a reader's request, check who the reader is (and, for their data, that it's theirs).
export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}
