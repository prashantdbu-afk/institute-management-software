import "server-only"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isUserRole, type AuthoritativeUser, type UserRole } from "@/lib/auth/permissions"

export async function getAuthoritativeUser(): Promise<AuthoritativeUser | null> {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) return null

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, branch_id, full_name")
    .eq("id", authData.user.id)
    .single()

  if (profileError || !profile || !isUserRole(profile.role)) return null

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    branchId: profile.branch_id,
    fullName: profile.full_name,
  }
}

export async function requireAuthoritativeUser() {
  const user = await getAuthoritativeUser()
  if (!user) redirect("/")
  return user
}

export async function requireRole(allowedRoles: readonly UserRole[]) {
  const user = await requireAuthoritativeUser()
  if (!allowedRoles.includes(user.role)) redirect("/dashboard?denied=1")
  return user
}
