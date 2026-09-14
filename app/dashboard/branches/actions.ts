"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/server"
import { branchFormSchema, getBranchErrorMessage, mapBranchRow, type BranchViewModel } from "@/lib/branches/model"
import { createBranch, deleteBranch, updateBranch } from "@/lib/supabase/queries"

type BranchActionResult = { ok: true; branch: BranchViewModel } | { ok: false; error: string }
type DeleteBranchActionResult = { ok: true } | { ok: false; error: string }

export async function createBranchAction(input: unknown): Promise<BranchActionResult> {
  await requireRole(["admin"])
  const parsed = branchFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid branch details." }

  try {
    const branch = await createBranch(parsed.data)
    revalidatePath("/dashboard/branches")
    return { ok: true, branch: mapBranchRow(branch) }
  } catch (error) {
    return { ok: false, error: getBranchErrorMessage(error, "create") }
  }
}

export async function updateBranchAction(id: string, input: unknown): Promise<BranchActionResult> {
  await requireRole(["admin"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid branch identifier." }

  const parsed = branchFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid branch details." }

  try {
    const branch = await updateBranch(id, parsed.data)
    revalidatePath("/dashboard/branches")
    return { ok: true, branch: mapBranchRow(branch) }
  } catch (error) {
    return { ok: false, error: getBranchErrorMessage(error, "update") }
  }
}

export async function deleteBranchAction(id: string): Promise<DeleteBranchActionResult> {
  await requireRole(["admin"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid branch identifier." }

  try {
    await deleteBranch(id)
    revalidatePath("/dashboard/branches")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: getBranchErrorMessage(error, "delete") }
  }
}
