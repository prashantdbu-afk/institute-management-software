import { z } from "zod"
import type { AuthoritativeUser, UserRole } from "@/lib/auth/permissions"

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const

const nullableUuidSchema = z.union([z.string().uuid(), z.null()])
const nullableTimestampSchema = z.union([z.string(), z.null()])

export const courseDatabaseRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  level: z.enum(courseLevels),
  duration_hours: z.number().int().nullable(),
  instructor_id: nullableUuidSchema,
  price: z.union([z.number(), z.string()]).nullable(),
  branch_id: nullableUuidSchema,
  created_at: nullableTimestampSchema,
  updated_at: nullableTimestampSchema,
})

export type CourseDatabaseRow = z.infer<typeof courseDatabaseRowSchema>

export const courseFormSchema = z.object({
  name: z.string().trim().min(1, "Course name is required").max(200),
  description: z.string().trim().max(2000),
  level: z.enum(courseLevels),
  durationHours: z.coerce.number().int().min(0, "Duration cannot be negative").max(100000),
  instructorId: nullableUuidSchema,
  price: z.coerce.number().min(0, "Price cannot be negative").max(99999999.99),
  branchId: z.string().uuid("Select a valid branch"),
})

export type CourseFormData = z.infer<typeof courseFormSchema>
export interface CourseCreatePayload {
  name: string
  description: string | null
  level: (typeof courseLevels)[number]
  duration_hours: number
  instructor_id: string | null
  price: number
  branch_id: string
}
export type CourseUpdatePayload = CourseCreatePayload

export interface CourseViewModel extends CourseFormData {
  id: string
  instructorName: string | null
  branchName: string
  createdAt: string | null
  updatedAt: string | null
}

export const branchOptionRowSchema = z.object({ id: z.string().uuid(), name: z.string() })
export const teacherOptionRowSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  email: z.string(),
  branch_id: nullableUuidSchema,
})
export interface BranchOption { id: string; name: string }
export interface TeacherOption { id: string; name: string; branchId: string | null }

export function mapTeacherOption(row: z.infer<typeof teacherOptionRowSchema>): TeacherOption {
  return { id: row.id, name: row.full_name?.trim() || row.email, branchId: row.branch_id }
}

export function toCoursePayload(data: CourseFormData): CourseCreatePayload {
  const parsed = courseFormSchema.parse(data)
  return {
    name: parsed.name,
    description: parsed.description || null,
    level: parsed.level,
    duration_hours: parsed.durationHours,
    instructor_id: parsed.instructorId,
    price: parsed.price,
    branch_id: parsed.branchId,
  }
}

export function mapCourseRow(
  row: CourseDatabaseRow,
  branches: BranchOption[],
  teachers: TeacherOption[],
): CourseViewModel {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    level: row.level,
    durationHours: row.duration_hours ?? 0,
    instructorId: row.instructor_id,
    price: row.price === null ? 0 : Number(row.price),
    branchId: row.branch_id ?? "",
    instructorName: teachers.find((teacher) => teacher.id === row.instructor_id)?.name ?? null,
    branchName: branches.find((branch) => branch.id === row.branch_id)?.name ?? "Unknown branch",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function canManageCourses(role: UserRole) {
  return role === "admin" || role === "branch_manager"
}

export function canManageBranch(user: AuthoritativeUser, branchId: string) {
  return user.role === "admin" || (user.role === "branch_manager" && user.branchId === branchId)
}

export function filterCourses(courses: CourseViewModel[], searchTerm: string, level: string) {
  const query = searchTerm.trim().toLowerCase()
  return courses.filter((course) => {
    const matchesSearch = !query || [course.name, course.instructorName ?? "", course.branchName]
      .some((value) => value.toLowerCase().includes(query))
    return matchesSearch && (!level || course.level === level)
  })
}

export function replaceCourse(courses: CourseViewModel[], updated: CourseViewModel) {
  return courses.map((course) => (course.id === updated.id ? updated : course))
}

interface DatabaseErrorLike { code?: string }

export function getCourseErrorMessage(error: unknown, operation: "load" | "create" | "update" | "delete") {
  const code = typeof error === "object" && error !== null ? (error as DatabaseErrorLike).code : undefined
  if (operation === "delete" && code === "23503") return "This course cannot be deleted because related records exist."
  if (code === "23505") return "A course with these details already exists."
  if (code === "42501") return "You do not have permission to manage courses in this branch."
  return `We could not ${operation === "load" ? "load courses" : `${operation} the course`}. Please try again.`
}
