import { z } from "zod"
import type { AuthoritativeUser } from "../auth/permissions"
import { profileDatabaseRowSchema, profileStatuses } from "../users/model"

export const teacherDetailRowSchema = z.object({ teacher_id: z.string().uuid(), branch_id: z.string().uuid(), qualification: z.string().nullable(), specialization: z.string().nullable(), experience_years: z.number().int(), status: z.enum(profileStatuses), joining_date: z.string().nullable(), created_at: z.string().nullable(), updated_at: z.string().nullable() })
export const teacherAssignmentRowSchema = z.object({ id: z.string().uuid(), teacher_id: z.string().uuid(), course_id: z.string().uuid(), branch_id: z.string().uuid(), status: z.enum(profileStatuses), created_at: z.string().nullable(), updated_at: z.string().nullable() })
export type TeacherDetailRow = z.infer<typeof teacherDetailRowSchema>
export type TeacherAssignmentRow = z.infer<typeof teacherAssignmentRowSchema>

export const teacherFormSchema = z.object({ fullName: z.string().trim().min(1).max(200), email: z.string().trim().email().max(320), phone: z.string().trim().max(50), branchId: z.string().uuid("Select a valid branch"), qualification: z.string().trim().max(200), specialization: z.string().trim().max(200), experienceYears: z.coerce.number().int().min(0).max(100), status: z.enum(profileStatuses), joiningDate: z.string().date(), courseIds: z.array(z.string().uuid()).max(100) })
export type TeacherFormData = z.infer<typeof teacherFormSchema>
export interface TeacherViewModel extends TeacherFormData { id: string; branchName: string; courseNames: string[]; createdAt: string | null; updatedAt: string | null }

export function validateAssignmentBranches(branchId: string, courseIds: string[], courses: { id: string; branchId: string }[]) {
  return courseIds.every((id) => courses.some((course) => course.id === id && course.branchId === branchId))
}
export function mapTeacher(profileInput: unknown, detailInput: unknown, assignments: TeacherAssignmentRow[], branches: { id: string; name: string }[], courses: { id: string; name: string; branchId: string }[]): TeacherViewModel {
  const profile = profileDatabaseRowSchema.parse(profileInput); const detail = teacherDetailRowSchema.parse(detailInput)
  if (profile.role !== "teacher" || profile.id !== detail.teacher_id || profile.branch_id !== detail.branch_id) throw new Error("Invalid teacher identity or branch")
  const assigned = assignments.filter((item) => item.teacher_id === profile.id && item.status === "active")
  return { id: profile.id, fullName: profile.full_name?.trim() || profile.email, email: profile.email, phone: profile.phone ?? "", branchId: detail.branch_id,
    branchName: branches.find((branch) => branch.id === detail.branch_id)?.name ?? "Unknown branch", qualification: detail.qualification ?? "", specialization: detail.specialization ?? "", experienceYears: detail.experience_years,
    status: detail.status, joiningDate: detail.joining_date ?? "", courseIds: assigned.map((item) => item.course_id), courseNames: assigned.map((item) => courses.find((course) => course.id === item.course_id)?.name ?? "Unknown course"), createdAt: detail.created_at, updatedAt: detail.updated_at }
}
export function canManageTeacher(actor: AuthoritativeUser, branchId: string) { return actor.role === "admin" || (actor.role === "branch_manager" && actor.branchId === branchId) }
export function filterTeachers(teachers: TeacherViewModel[], search: string) { const q=search.trim().toLowerCase(); return !q ? teachers : teachers.filter((teacher) => [teacher.fullName, teacher.email, teacher.specialization, teacher.branchName].some((value) => value.toLowerCase().includes(q))) }
export function replaceTeacher(teachers: TeacherViewModel[], updated: TeacherViewModel) { return teachers.map((teacher) => teacher.id === updated.id ? updated : teacher) }
export function getTeacherErrorMessage(error: unknown, operation: "load" | "provision" | "update" | "archive") { const code=typeof error === "object" && error !== null ? (error as {code?:string}).code : undefined; if(code==="42501") return "You do not have permission to manage this teacher."; if(code==="23503"||code==="23514") return "The teacher, branch, and course assignments must belong together."; if(code==="23505") return "This teacher or course assignment already exists."; return `We could not ${operation === "load" ? "load teachers" : `${operation} the teacher`}. Please try again.` }
