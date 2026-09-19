import { z } from "zod"
import { roles, type AuthoritativeUser, type UserRole } from "../auth/permissions"

export const profileStatuses = ["active", "inactive"] as const
const nullableUuid = z.string().uuid().nullable()

export const profileDatabaseRowSchema = z.object({
  id: z.string().uuid(), email: z.string().email(), full_name: z.string().nullable(), phone: z.string().nullable(),
  role: z.enum(roles), branch_id: nullableUuid, status: z.enum(profileStatuses),
  created_at: z.string().nullable(), updated_at: z.string().nullable(),
})
export type ProfileDatabaseRow = z.infer<typeof profileDatabaseRowSchema>

export const userFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  phone: z.string().trim().max(50), role: z.enum(roles), branchId: nullableUuid,
  status: z.enum(profileStatuses),
}).superRefine((value, context) => {
  if (value.role !== "admin" && !value.branchId) context.addIssue({ code: "custom", path: ["branchId"], message: "Select a branch for this role" })
  if (value.role === "admin" && value.branchId) context.addIssue({ code: "custom", path: ["branchId"], message: "Admins must not be assigned to one branch" })
})
export type UserFormData = z.infer<typeof userFormSchema>
export interface UserViewModel extends UserFormData { id: string; branchName: string; createdAt: string | null; updatedAt: string | null }

export function mapProfileRow(row: ProfileDatabaseRow, branches: { id: string; name: string }[]): UserViewModel {
  return { id: row.id, fullName: row.full_name?.trim() || row.email, email: row.email, phone: row.phone ?? "", role: row.role,
    branchId: row.branch_id, branchName: row.branch_id ? branches.find((branch) => branch.id === row.branch_id)?.name ?? "Unknown branch" : "All branches",
    status: row.status, createdAt: row.created_at, updatedAt: row.updated_at }
}

export function canManageUser(actor: AuthoritativeUser, target: Pick<UserViewModel, "id" | "role" | "branchId">) {
  return actor.role === "admin" && actor.id !== target.id
}
export function canAssignRole(actor: AuthoritativeUser, role: UserRole) { return actor.role === "admin" && roles.includes(role) }
export function filterUsers(users: UserViewModel[], search: string, role: string) {
  const query = search.trim().toLowerCase()
  return users.filter((user) => (!query || [user.fullName, user.email, user.branchName].some((value) => value.toLowerCase().includes(query))) && (!role || user.role === role))
}
export function replaceUser(users: UserViewModel[], updated: UserViewModel) { return users.map((user) => user.id === updated.id ? updated : user) }

export function getUserErrorMessage(error: unknown, operation: "load" | "provision" | "update") {
  const code = typeof error === "object" && error !== null ? (error as { code?: string }).code : undefined
  if (code === "23505") return "A user with this email already exists."
  if (code === "42501") return "You do not have permission to manage this user."
  return `We could not ${operation === "load" ? "load users" : operation === "provision" ? "provision the user" : "update the user"}. Please try again.`
}
