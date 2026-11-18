"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { supabasePublicEnv } from "./env";

export function createClient() {
  const { url, key } = supabasePublicEnv();

  return createBrowserClient<Database>(url, key);
}
