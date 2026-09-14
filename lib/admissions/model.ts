import { z } from "zod"
import type { UserRole } from "@/lib/auth/permissions"

export const admissionStatuses = ["pending", "approved", "rejected"] as const
const optionalDateSchema = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")])

export const admissionDatabaseRowSchema = z.object({
  id: z.string().uuid(),
  student_name: z.string(),
  parent_name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  dob: z.string().nullable(),
  address: z.string().nullable(),
  course_id: z.string().uuid().nullable(),
  batch_id: z.string().uuid().nullable(),
  branch_id: z.string().uuid().nullable(),
  status: z.enum(admissionStatuses),
  notes: z.string().nullable(),
  enrollment_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export type AdmissionDatabaseRow = z.infer<typeof admissionDatabaseRowSchema>

export const admissionFormSchema = z.object({
  studentName: z.string().trim().min(1, "Student name is required").max(200),
  parentName: z.string().trim().max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  phone: z.string().trim().refine((value) => !value || (/^[0-9+()\-\s]+$/.test(value) && value.length >= 7 && value.length <= 25), "Enter a valid phone number"),
  dob: optionalDateSchema,
  address: z.string().trim().max(500),
  branchId: z.string().uuid("Select a valid branch"),
  courseId: z.string().uuid("Select a valid course"),
  batchId: z.string().uuid("Select a valid batch"),
  notes: z.string().trim().max(2000),
})

export type AdmissionFormData = z.infer<typeof admissionFormSchema>
export interface AdmissionCreatePayload {
  student_name: string
  parent_name: string | null
  email: string
  phone: string | null
  dob: string | null
  address: string | null
  course_id: string
  batch_id: string
  branch_id: string
  status: "pending"
  notes: string | null
}
export type AdmissionUpdatePayload = Omit<AdmissionCreatePayload, "status">

export interface AdmissionViewModel extends AdmissionFormData {
  id: string
  branchName: string
  courseName: string
  batchName: string
  status: (typeof admissionStatuses)[number]
  appliedDate: string
  enrollmentDate: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface NamedReference { id: string; name: string }
interface CourseReference extends NamedReference { branchId: string }
interface BatchReference extends NamedReference { branchId: string; courseId: string }

export function toAdmissionPayload(data: AdmissionFormData): AdmissionCreatePayload {
  const parsed = admissionFormSchema.parse(data)
  return {
    student_name: parsed.studentName,
    parent_name: parsed.parentName || null,
    email: parsed.email,
    phone: parsed.phone || null,
    dob: parsed.dob || null,
    address: parsed.address || null,
    branch_id: parsed.branchId,
    course_id: parsed.courseId,
    batch_id: parsed.batchId,
    status: "pending",
    notes: parsed.notes || null,
  }
}

export function toAdmissionUpdatePayload(data: AdmissionFormData): AdmissionUpdatePayload {
  const payload = toAdmissionPayload(data)
  return {
    student_name: payload.student_name,
    parent_name: payload.parent_name,
    email: payload.email,
    phone: payload.phone,
    dob: payload.dob,
    address: payload.address,
    branch_id: payload.branch_id,
    course_id: payload.course_id,
    batch_id: payload.batch_id,
    notes: payload.notes,
  }
}

export function mapAdmissionRow(row: AdmissionDatabaseRow, branches: NamedReference[], courses: CourseReference[], batches: BatchReference[]): AdmissionViewModel {
  return {
    id: row.id,
    studentName: row.student_name,
    parentName: row.parent_name ?? "",
    email: row.email,
    phone: row.phone ?? "",
    dob: row.dob ?? "",
    address: row.address ?? "",
    branchId: row.branch_id ?? "",
    courseId: row.course_id ?? "",
    batchId: row.batch_id ?? "",
    notes: row.notes ?? "",
    branchName: branches.find((item) => item.id === row.branch_id)?.name ?? "Unknown branch",
    courseName: courses.find((item) => item.id === row.course_id)?.name ?? "Unknown course",
    batchName: batches.find((item) => item.id === row.batch_id)?.name ?? "Unknown batch",
    status: row.status,
    appliedDate: row.created_at?.slice(0, 10) ?? "",
    enrollmentDate: row.enrollment_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function isAdmissionRelationshipConsistent(data: Pick<AdmissionFormData, "branchId" | "courseId" | "batchId">, courses: CourseReference[], batches: BatchReference[]) {
  const course = courses.find((item) => item.id === data.courseId)
  const batch = batches.find((item) => item.id === data.batchId)
  return Boolean(course && batch && course.branchId === data.branchId && batch.branchId === data.branchId && batch.courseId === data.courseId)
}

export function canManageAdmissions(role: UserRole) {
  return role === "admin" || role === "branch_manager"
}

export function canTransitionAdmission(current: AdmissionViewModel["status"], next: AdmissionViewModel["status"], hasEnrollment: boolean) {
  if (hasEnrollment) return next === "approved"
  if (current === "rejected") return next === "rejected"
  return current === next || (current === "pending" && (next === "approved" || next === "rejected"))
}

export function filterAdmissions(admissions: AdmissionViewModel[], searchTerm: string, status: string) {
  const query = searchTerm.trim().toLowerCase()
  return admissions.filter((admission) => {
    const matchesSearch = !query || [admission.studentName, admission.email, admission.phone].some((value) => value.toLowerCase().includes(query))
    return matchesSearch && (status === "all" || admission.status === status)
  })
}

export function replaceAdmission(admissions: AdmissionViewModel[], updated: AdmissionViewModel) {
  return admissions.map((admission) => admission.id === updated.id ? updated : admission)
}

interface DatabaseErrorLike { code?: string }
export function getAdmissionErrorMessage(error: unknown, operation: "load" | "create" | "update" | "approve" | "reject" | "delete") {
  const code = typeof error === "object" && error !== null ? (error as DatabaseErrorLike).code : undefined
  if (operation === "delete" && code === "23503") return "This admission cannot be deleted because it has an enrollment record."
  if (operation === "reject" && code === "23503") return "An enrolled admission cannot be rejected."
  if (code === "23503" || code === "23514") return "The selected Branch, Course, or Batch relationship is invalid."
  if (code === "42501") return "You do not have permission to manage admissions in this branch."
  return `We could not ${operation === "load" ? "load admissions" : `${operation} the admission`}. Please try again.`
}
