import { rm } from "node:fs/promises"
import { createClient } from "@supabase/supabase-js"
import { readE2EState, statePath } from "./support"

export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return

  const state = await readE2EState().catch(() => null)
  if (!state) return
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  await admin.from("branches").delete().like("name", "V1 E2E %")
  for (const { id } of Object.values(state.users)) {
    await admin.from("profiles").delete().eq("id", id)
    await admin.auth.admin.deleteUser(id)
  }
  await rm(statePath, { force: true })
}
