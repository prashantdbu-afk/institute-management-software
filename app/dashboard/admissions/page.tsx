import { AdmissionsClient } from "@/components/dashboard/admissions-client"
import { mapAdmissionRow } from "@/lib/admissions/model"
import { getAdmissionCatalog } from "@/lib/admissions/server"
import { requireRole } from "@/lib/auth/server"
import { getAdmissions } from "@/lib/supabase/queries"

export default async function AdmissionsPage() {
  await requireRole(["admin", "branch_manager"])
  const [rows, catalog] = await Promise.all([getAdmissions(), getAdmissionCatalog()])
  const admissions = rows.map((row) => mapAdmissionRow(row, catalog.branches, catalog.courses, catalog.batches))
  return <AdmissionsClient initialAdmissions={admissions} {...catalog} />
}
