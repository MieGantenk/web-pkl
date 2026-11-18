import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";
import { supabasePublicEnv } from "./env";

export async function createClient() {
  const { url, key } = supabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component tidak boleh menulis cookie.
          // Refresh sesi dilakukan di middleware/proxy.
        }
      },
    },
  });
}
