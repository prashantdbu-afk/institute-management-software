import { z } from "zod"

export const enrollmentStatuses = ["active", "inactive", "completed", "cancelled"] as const

export const enrollmentDatabaseRowSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid().nullable(),
  admission_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  course_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  status: z.enum(enrollmentStatuses),
  enrollment_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type EnrollmentDatabaseRow = z.infer<typeof enrollmentDatabaseRowSchema>

export interface StudentEnrollmentViewModel {
  id: string
  studentId: string | null
  admissionId: string
  name: string
  email: string
  course: string
  batch: string
  enrollmentDate: string
  status: (typeof enrollmentStatuses)[number]
}

interface AdmissionReference { id: string; studentName: string; email: string }
interface NamedReference { id: string; name: string }

export function mapEnrollmentRow(row: EnrollmentDatabaseRow, admissions: AdmissionReference[], courses: NamedReference[], batches: NamedReference[]): StudentEnrollmentViewModel {
  const admission = admissions.find((item) => item.id === row.admission_id)
  return {
    id: row.id,
    studentId: row.student_id,
    admissionId: row.admission_id,
    name: admission?.studentName ?? "Unknown student",
    email: admission?.email ?? "",
    course: courses.find((item) => item.id === row.course_id)?.name ?? "Unknown course",
    batch: batches.find((item) => item.id === row.batch_id)?.name ?? "Unknown batch",
    enrollmentDate: row.enrollment_date,
    status: row.status,
  }
}

export function hasDuplicateAdmissionEnrollment(rows: EnrollmentDatabaseRow[]) {
  return new Set(rows.map((row) => row.admission_id)).size !== rows.length
}

export function isEnrollmentBranchConsistent(row: Pick<EnrollmentDatabaseRow, "branch_id" | "course_id" | "batch_id">, courses: Array<{ id: string; branchId: string }>, batches: Array<{ id: string; courseId: string; branchId: string }>) {
  const course = courses.find((item) => item.id === row.course_id)
  const batch = batches.find((item) => item.id === row.batch_id)
  return Boolean(course && batch && course.branchId === row.branch_id && batch.branchId === row.branch_id && batch.courseId === row.course_id)
}
