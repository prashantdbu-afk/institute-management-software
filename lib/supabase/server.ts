import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseEnvironment } from "@/lib/env"

export async function createClient() {
  const cookieStore = await cookies()
  const env = getSupabaseEnvironment()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore errors in Server Components
        }
      },
    },
  })
}
