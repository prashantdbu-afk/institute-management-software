import { BranchesClient } from "@/components/dashboard/branches-client"
import { mapBranchRow } from "@/lib/branches/model"
import { requireRole } from "@/lib/auth/server"
import { getBranches } from "@/lib/supabase/queries"

export default async function BranchesPage() {
  await requireRole(["admin"])
  const branches = (await getBranches()).map(mapBranchRow)

  return <BranchesClient initialBranches={branches} />
}
