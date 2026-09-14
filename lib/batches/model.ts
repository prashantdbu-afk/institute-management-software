import { z } from "zod"
import type { UserRole } from "@/lib/auth/permissions"

const optionalDateSchema = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")])

export const batchDatabaseRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  course_id: z.string().uuid(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  teacher_id: z.string().uuid().nullable(),
  capacity: z.number().int().nullable(),
  current_enrollment: z.number().int().nullable(),
  branch_id: z.string().uuid().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export type BatchDatabaseRow = z.infer<typeof batchDatabaseRowSchema>

export const batchFormSchema = z.object({
  name: z.string().trim().min(1, "Batch name is required").max(200),
  courseId: z.string().uuid("Select a valid course"),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  teacherId: z.union([z.string().uuid(), z.null()]),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(100000),
}).refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
  message: "End date must be on or after the start date",
  path: ["endDate"],
})

export type BatchFormData = z.infer<typeof batchFormSchema>
export interface BatchCreatePayload {
  name: string
  course_id: string
  start_date: string | null
  end_date: string | null
  teacher_id: string | null
  capacity: number
  branch_id: string
}
export type BatchUpdatePayload = BatchCreatePayload

export interface BatchViewModel extends BatchFormData {
  id: string
  branchId: string
  courseName: string
  teacherName: string | null
  currentEnrollment: number
  createdAt: string | null
  updatedAt: string | null
}

interface BatchReference { id: string; name: string; branchId: string }
interface TeacherReference { id: string; name: string; branchId: string | null }

export function toBatchPayload(data: BatchFormData, branchId: string): BatchCreatePayload {
  const parsed = batchFormSchema.parse(data)
  return {
    name: parsed.name,
    course_id: parsed.courseId,
    start_date: parsed.startDate || null,
    end_date: parsed.endDate || null,
    teacher_id: parsed.teacherId,
    capacity: parsed.capacity,
    branch_id: branchId,
  }
}

export function mapBatchRow(row: BatchDatabaseRow, courses: BatchReference[], teachers: TeacherReference[]): BatchViewModel {
  const course = courses.find((item) => item.id === row.course_id)
  return {
    id: row.id,
    name: row.name,
    courseId: row.course_id,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    teacherId: row.teacher_id,
    capacity: row.capacity ?? 30,
    branchId: row.branch_id ?? "",
    courseName: course?.name ?? "Unknown course",
    teacherName: teachers.find((teacher) => teacher.id === row.teacher_id)?.name ?? null,
    currentEnrollment: row.current_enrollment ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function isBatchBranchConsistent(courseBranchId: string, batchBranchId: string) {
  return courseBranchId === batchBranchId
}

export function canManageBatches(role: UserRole) {
  return role === "admin" || role === "branch_manager"
}

export function replaceBatch(batches: BatchViewModel[], updated: BatchViewModel) {
  return batches.map((batch) => (batch.id === updated.id ? updated : batch))
}

interface DatabaseErrorLike { code?: string }

export function getBatchErrorMessage(error: unknown, operation: "load" | "create" | "update" | "delete") {
  const code = typeof error === "object" && error !== null ? (error as DatabaseErrorLike).code : undefined
  if (operation === "delete" && code === "23503") return "This batch cannot be deleted because related records exist."
  if (code === "23505") return "A batch with these details already exists."
  if (code === "23514" || code === "23503") return "The batch details conflict with its course or branch."
  if (code === "42501") return "You do not have permission to manage batches in this branch."
  return `We could not ${operation === "load" ? "load batches" : `${operation} the batch`}. Please try again.`
}
