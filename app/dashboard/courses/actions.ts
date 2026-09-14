"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/server"
import {
  canManageBranch,
  courseFormSchema,
  getCourseErrorMessage,
  mapCourseRow,
  toCoursePayload,
  type CourseViewModel,
  type TeacherOption,
} from "@/lib/courses/model"
import {
  batchFormSchema,
  getBatchErrorMessage,
  mapBatchRow,
  toBatchPayload,
  type BatchViewModel,
} from "@/lib/batches/model"
import {
  createBatch,
  createCourse,
  deleteBatch,
  deleteCourse,
  getCourseById,
  getCourseReferences,
  getCourses,
  updateBatch,
  updateCourse,
} from "@/lib/supabase/queries"

type CourseActionResult = { ok: true; course: CourseViewModel } | { ok: false; error: string }
type BatchActionResult = { ok: true; batch: BatchViewModel } | { ok: false; error: string }
type DeleteActionResult = { ok: true } | { ok: false; error: string }

function teacherMatchesBranch(teachers: TeacherOption[], teacherId: string | null, branchId: string) {
  return teacherId === null || teachers.some((teacher) => teacher.id === teacherId && teacher.branchId === branchId)
}

async function mapCurrentCourse(row: Awaited<ReturnType<typeof createCourse>>) {
  const { branches, teachers } = await getCourseReferences()
  return mapCourseRow(row, branches, teachers)
}

async function mapCurrentBatch(row: Awaited<ReturnType<typeof createBatch>>) {
  const [{ branches, teachers }, courses] = await Promise.all([getCourseReferences(), getCourses()])
  return mapBatchRow(row, courses.map((course) => mapCourseRow(course, branches, teachers)), teachers)
}

export async function createCourseAction(input: unknown): Promise<CourseActionResult> {
  const user = await requireRole(["admin", "branch_manager"])
  const parsed = courseFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid course details." }
  if (!canManageBranch(user, parsed.data.branchId)) return { ok: false, error: "You cannot manage courses in this branch." }

  try {
    const { teachers } = await getCourseReferences()
    if (!teacherMatchesBranch(teachers, parsed.data.instructorId, parsed.data.branchId)) {
      return { ok: false, error: "The selected instructor does not belong to this branch." }
    }
    const row = await createCourse(toCoursePayload(parsed.data))
    revalidatePath("/dashboard/courses")
    return { ok: true, course: await mapCurrentCourse(row) }
  } catch (error) {
    return { ok: false, error: getCourseErrorMessage(error, "create") }
  }
}

export async function updateCourseAction(id: string, input: unknown): Promise<CourseActionResult> {
  const user = await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid course identifier." }
  const parsed = courseFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid course details." }
  if (!canManageBranch(user, parsed.data.branchId)) return { ok: false, error: "You cannot manage courses in this branch." }

  try {
    const { teachers } = await getCourseReferences()
    if (!teacherMatchesBranch(teachers, parsed.data.instructorId, parsed.data.branchId)) {
      return { ok: false, error: "The selected instructor does not belong to this branch." }
    }
    const row = await updateCourse(id, toCoursePayload(parsed.data))
    revalidatePath("/dashboard/courses")
    return { ok: true, course: await mapCurrentCourse(row) }
  } catch (error) {
    return { ok: false, error: getCourseErrorMessage(error, "update") }
  }
}

export async function deleteCourseAction(id: string): Promise<DeleteActionResult> {
  await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid course identifier." }
  try {
    await deleteCourse(id)
    revalidatePath("/dashboard/courses")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: getCourseErrorMessage(error, "delete") }
  }
}

export async function createBatchAction(input: unknown): Promise<BatchActionResult> {
  const user = await requireRole(["admin", "branch_manager"])
  const parsed = batchFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid batch details." }

  try {
    const [course, { teachers }] = await Promise.all([getCourseById(parsed.data.courseId), getCourseReferences()])
    if (!course.branch_id || !canManageBranch(user, course.branch_id)) return { ok: false, error: "You cannot manage batches in this branch." }
    if (!teacherMatchesBranch(teachers, parsed.data.teacherId, course.branch_id)) {
      return { ok: false, error: "The selected teacher does not belong to the course branch." }
    }
    const row = await createBatch(toBatchPayload(parsed.data, course.branch_id))
    revalidatePath("/dashboard/courses")
    return { ok: true, batch: await mapCurrentBatch(row) }
  } catch (error) {
    return { ok: false, error: getBatchErrorMessage(error, "create") }
  }
}

export async function updateBatchAction(id: string, input: unknown): Promise<BatchActionResult> {
  const user = await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid batch identifier." }
  const parsed = batchFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid batch details." }

  try {
    const [course, { teachers }] = await Promise.all([getCourseById(parsed.data.courseId), getCourseReferences()])
    if (!course.branch_id || !canManageBranch(user, course.branch_id)) return { ok: false, error: "You cannot manage batches in this branch." }
    if (!teacherMatchesBranch(teachers, parsed.data.teacherId, course.branch_id)) {
      return { ok: false, error: "The selected teacher does not belong to the course branch." }
    }
    const row = await updateBatch(id, toBatchPayload(parsed.data, course.branch_id))
    revalidatePath("/dashboard/courses")
    return { ok: true, batch: await mapCurrentBatch(row) }
  } catch (error) {
    return { ok: false, error: getBatchErrorMessage(error, "update") }
  }
}

export async function deleteBatchAction(id: string): Promise<DeleteActionResult> {
  await requireRole(["admin", "branch_manager"])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Invalid batch identifier." }
  try {
    await deleteBatch(id)
    revalidatePath("/dashboard/courses")
    return { ok: true }
  } catch (error) {
    return { ok: false, error: getBatchErrorMessage(error, "delete") }
  }
}
