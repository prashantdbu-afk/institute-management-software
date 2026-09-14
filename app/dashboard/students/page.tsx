import { StudentsClient } from "@/components/dashboard/students-client"
import { mapAdmissionRow } from "@/lib/admissions/model"
import { getAdmissionCatalog } from "@/lib/admissions/server"
import { requireRole } from "@/lib/auth/server"
import { mapEnrollmentRow } from "@/lib/enrollments/model"
import { getAdmissions, getStudentEnrollments } from "@/lib/supabase/queries"

export default async function StudentsPage() {
  await requireRole(["admin", "branch_manager"])
  const [enrollments, admissionRows, catalog] = await Promise.all([getStudentEnrollments(), getAdmissions(), getAdmissionCatalog()])
  const admissions = admissionRows.map((row) => mapAdmissionRow(row, catalog.branches, catalog.courses, catalog.batches))
  const students = enrollments.map((row) => mapEnrollmentRow(row, admissions, catalog.courses, catalog.batches))
  return <StudentsClient students={students} />
}
