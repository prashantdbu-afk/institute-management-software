import "server-only"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseEnvironment, getSupabaseServiceRoleKey } from "@/lib/env"

export function createAdminClient() {
  const serviceRoleKey = getSupabaseServiceRoleKey()
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  const env = getSupabaseEnvironment()
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function inviteAuthUser(email: string, fullName: string, redirectTo: string) {
  const admin = createAdminClient()
  const metadata = { first_name: fullName }
  const invited = await admin.auth.admin.inviteUserByEmail(email, { data: metadata, redirectTo })
  if (!invited.error && invited.data.user) return { user: invited.data.user, invitationSent: true }
  if (invited.error?.code !== "over_email_send_rate_limit") throw invited.error ?? new Error("Invitation did not create an Auth user")

  const generated = await admin.auth.admin.generateLink({ type: "invite", email, options: { data: metadata, redirectTo } })
  if (generated.error || !generated.data.user) throw generated.error ?? new Error("Invitation fallback did not create an Auth user")
  return { user: generated.data.user, invitationSent: false }
}
