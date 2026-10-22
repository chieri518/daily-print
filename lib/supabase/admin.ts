import { createClient } from "@supabase/supabase-js";

// A Supabase client with full access, for the edition workflow. Never use it for requests from readers.
export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}
