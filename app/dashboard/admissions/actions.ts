"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  admissionFormSchema,
  getAdmissionErrorMessage,
  isAdmissionRelationshipConsistent,
  mapAdmissionRow,
  toAdmissionPayload,
  toAdmissionUpdatePayload,
  type AdmissionViewModel,
} from "@/lib/admissions/model"
import { getAdmissionCatalog } from "@/lib/admissions/server"
import { requireRole } from "@/lib/auth/server"
import { canManageBranch } from "@/lib/courses/model"
import {
  approveAdmission,
  createAdmission,
  deleteAdmission,
  getAdmissionById,
  rejectAdmission,
  updateAdmission,
} from "@/lib/supabase/queries"

type AdmissionActionResult = { ok: true; admission: AdmissionViewModel } | { ok: false; error: string }
type DeleteActionResult = { ok: true } | { ok: false; error: string }

async function mapCurrentAdmission(row: Awaited<ReturnType<typeof getAdmissionById>>) {
  const catalog = await getAdmissionCatalog()
  return mapAdmissionRow(row, catalog.branches, catalog.courses, catalog.batches)
}

export async function createAdmissionAction(input: unknown): Promise<AdmissionActionResult> {
  const user = await requireRole(["admin", "branch_manager"])
  const parsed = admissionFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid admission details." }
  if (!canManageBranch(user, parsed.data.branchId)) return { ok: false, error: "You cannot manage admissions in this branch." }

  try {
    const catalog = await getAdmissionCatalog()
    if (!isAdmissionRelationshipConsistent(parsed.data, catalog.courses, catalog.batches)) {
      return { ok: false, error: "The selected Branch, Course, and Batch do not belong together." }
    }
    const row = await createAdmission(toAdmissionPayload(parsed.data))
    revalidatePath("/dashboard/admissions")
    return { ok: true, admission: mapAdmissionRow(row, catalog.branches, catalog.courses, catalog.batches) }
  } catch (error) {
    return { ok: false, error: getAdmissionErrorMessage(error, "create") }
  }
}

export async function updateAdmissionAction(id: string, input: unknown): Promise<AdmissionActionResult> {
  const user = await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid admission identifier." }
  const parsed = admissionFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid admission details." }
  if (!canManageBranch(user, parsed.data.branchId)) return { ok: false, error: "You cannot manage admissions in this branch." }

  try {
    const [current, catalog] = await Promise.all([getAdmissionById(id), getAdmissionCatalog()])
    if (current.status !== "pending") return { ok: false, error: "Only pending admissions can be edited." }
    if (!current.branch_id || !canManageBranch(user, current.branch_id)) return { ok: false, error: "You cannot manage this admission." }
    if (!isAdmissionRelationshipConsistent(parsed.data, catalog.courses, catalog.batches)) {
      return { ok: false, error: "The selected Branch, Course, and Batch do not belong together." }
    }
    const row = await updateAdmission(id, toAdmissionUpdatePayload(parsed.data))
    revalidatePath("/dashboard/admissions")
    return { ok: true, admission: mapAdmissionRow(row, catalog.branches, catalog.courses, catalog.batches) }
  } catch (error) {
    return { ok: false, error: getAdmissionErrorMessage(error, "update") }
  }
}

export async function approveAdmissionAction(id: string): Promise<AdmissionActionResult> {
  await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid admission identifier." }
  try {
    await approveAdmission(id)
    const row = await getAdmissionById(id)
    revalidatePath("/dashboard/admissions")
    revalidatePath("/dashboard/students")
    return { ok: true, admission: await mapCurrentAdmission(row) }
  } catch (error) {
    return { ok: false, error: getAdmissionErrorMessage(error, "approve") }
  }
}

export async function rejectAdmissionAction(id: string): Promise<AdmissionActionResult> {
  await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid admission identifier." }
  try {
    const row = await rejectAdmission(id)
    revalidatePath("/dashboard/admissions")
    return { ok: true, admission: await mapCurrentAdmission(row) }
  } catch (error) {
    return { ok: false, error: getAdmissionErrorMessage(error, "reject") }
  }
}

export async function deleteAdmissionAction(id: string): Promise<DeleteActionResult> {
  await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid admission identifier." }
  try {
    await deleteAdmission(id)
    revalidatePath("/dashboard/admissions")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: getAdmissionErrorMessage(error, "delete") }
  }
}
