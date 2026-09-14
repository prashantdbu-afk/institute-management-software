import "server-only"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseEnvironment, getSupabaseServiceRoleKey } from "@/lib/env"

export function createAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey()
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  const env = getSupabaseEnvironment()
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}
