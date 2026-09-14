import { UsersClient } from "@/components/dashboard/users-client"
import { requireRole } from "@/lib/auth/server"
import { mapBranchRow } from "@/lib/branches/model"
import { getBranches, getProfiles } from "@/lib/supabase/queries"
import { mapProfileRow } from "@/lib/users/model"

export default async function UsersPage() {
  const actor = await requireRole(["admin"])
  const [profileRows, branchRows] = await Promise.all([getProfiles(), getBranches()])
  const branches = branchRows.map(mapBranchRow)
  return <UsersClient actorId={actor.id} initialUsers={profileRows.map((row) => mapProfileRow(row, branches))} branches={branches.map(({ id, name }) => ({ id, name }))} />
}
