import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { statePath, type E2EState } from "./support"

export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error("E2E requires NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY")

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const password = `V1-E2E-${crypto.randomUUID()}!aA9`
  const users = {} as E2EState["users"]

  try {
    for (const role of ["admin", "student", "teacher"] as const) {
      const email = `v1.e2e.${role}.${runId}@example.com`
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
      if (error || !data.user) throw error ?? new Error(`Unable to create ${role} E2E user`)
      users[role] = { id: data.user.id, email }
      const { error: profileError } = await admin.from("profiles").update({ role, full_name: `V1 E2E ${role}`, status: "active", branch_id: null }).eq("id", data.user.id)
      if (profileError) throw profileError
    }
    await mkdir(path.dirname(statePath), { recursive: true })
    await writeFile(statePath, JSON.stringify({ password, users } satisfies E2EState), { mode: 0o600 })
  } catch (error) {
    await Promise.all(Object.values(users).map(({ id }) => admin.auth.admin.deleteUser(id)))
    throw error
  }
}
