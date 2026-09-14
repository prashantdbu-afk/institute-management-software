import { z } from "zod"
import type { UserRole } from "@/lib/auth/permissions"

export const branchDatabaseRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  principal_name: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export type BranchDatabaseRow = z.infer<typeof branchDatabaseRowSchema>

export const branchFormSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required").max(200),
  address: z.string().trim().min(1, "Address is required").max(500),
  city: z.string().trim().min(1, "City is required").max(200),
  phone: z.string().trim().max(50),
  email: z.string().trim().email("Enter a valid email address").max(320),
})

export type BranchFormData = z.infer<typeof branchFormSchema>
export type BranchCreatePayload = BranchFormData
export type BranchUpdatePayload = Partial<BranchCreatePayload>

export interface BranchViewModel extends BranchFormData {
  id: string
  principalName: string | null
  createdAt: string | null
  updatedAt: string | null
}

export function mapBranchRow(row: BranchDatabaseRow): BranchViewModel {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    city: row.city ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    principalName: row.principal_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toBranchPayload(data: BranchFormData): BranchCreatePayload {
  return branchFormSchema.parse(data)
}

export function filterBranches(branches: BranchViewModel[], searchTerm: string) {
  const query = searchTerm.trim().toLowerCase()
  if (!query) return branches

  return branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(query) ||
      branch.city.toLowerCase().includes(query) ||
      branch.email.toLowerCase().includes(query),
  )
}

export function replaceBranch(branches: BranchViewModel[], updatedBranch: BranchViewModel) {
  return branches.map((branch) => (branch.id === updatedBranch.id ? updatedBranch : branch))
}

export function isBranchListEmpty(branches: BranchViewModel[], searchTerm: string) {
  return branches.length === 0 && searchTerm.trim() === ""
}

export function canManageBranches(role: UserRole) {
  return role === "admin"
}

interface DatabaseErrorLike {
  code?: string
}

export function getBranchErrorMessage(error: unknown, operation: "load" | "create" | "update" | "delete") {
  const code = typeof error === "object" && error !== null ? (error as DatabaseErrorLike).code : undefined

  if (operation === "delete" && code === "23503") {
    return "This branch cannot be deleted because other institute records still reference it."
  }
  if (code === "23505") return "A branch with these details already exists."
  if (code === "42501") return "You do not have permission to manage branches."

  const fallbacks = {
    load: "We could not load branches. Please try again.",
    create: "We could not create the branch. Please try again.",
    update: "We could not update the branch. Please try again.",
    delete: "We could not delete the branch. Please try again.",
  }
  return fallbacks[operation]
}
