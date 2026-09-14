import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  batchDatabaseRowSchema,
  batchFormSchema,
  canManageBatches,
  getBatchErrorMessage,
  isBatchBranchConsistent,
  mapBatchRow,
  replaceBatch,
  toBatchPayload,
  type BatchViewModel,
} from "../../lib/batches/model"

const courseId = "11111111-1111-4111-8111-111111111111"
const branchId = "22222222-2222-4222-8222-222222222222"
const batch: BatchViewModel = { id: "33333333-3333-4333-8333-333333333333", name: "Morning", courseId, startDate: "2026-01-01", endDate: "2026-02-01", teacherId: null, capacity: 30, branchId, courseName: "TypeScript", teacherName: null, currentEnrollment: 0, createdAt: null, updatedAt: null }

describe("batch mapping and validation", () => {
  it("maps real course and branch relationships", () => {
    const row = batchDatabaseRowSchema.parse({ id: batch.id, name: batch.name, course_id: courseId, start_date: batch.startDate, end_date: batch.endDate, teacher_id: null, capacity: 30, current_enrollment: 0, branch_id: branchId, created_at: null, updated_at: null })
    expect(mapBatchRow(row, [{ id: courseId, name: "TypeScript", branchId }], [])).toMatchObject({ courseId, courseName: "TypeScript", branchId })
  })

  it("requires a real course UUID and valid capacity/date range", () => {
    expect(batchFormSchema.safeParse({ ...batch, courseId: "TypeScript" }).success).toBe(false)
    expect(batchFormSchema.safeParse({ ...batch, capacity: 0 }).success).toBe(false)
    expect(batchFormSchema.safeParse({ ...batch, endDate: "2025-01-01" }).success).toBe(false)
  })

  it("derives the database branch from the selected course", () => {
    const parsed = batchFormSchema.parse(batch)
    expect(toBatchPayload(parsed, branchId)).toMatchObject({ course_id: courseId, branch_id: branchId })
    expect(isBatchBranchConsistent(branchId, branchId)).toBe(true)
    expect(isBatchBranchConsistent(branchId, "44444444-4444-4444-8444-444444444444")).toBe(false)
  })
})

describe("batch behavior and access", () => {
  it("updates by database identity", () => {
    expect(replaceBatch([batch], { ...batch, name: "Evening" })[0]?.name).toBe("Evening")
  })

  it("restricts management roles", () => {
    expect(canManageBatches("admin")).toBe(true)
    expect(canManageBatches("branch_manager")).toBe(true)
    expect(canManageBatches("teacher")).toBe(false)
    expect(canManageBatches("student")).toBe(false)
  })

  it("returns a safe dependent-record deletion message", () => {
    expect(getBatchErrorMessage({ code: "23503" }, "delete")).toBe("This batch cannot be deleted because related records exist.")
  })

  it("has no batch localStorage or hard-coded demo batches in the migrated path", () => {
    const sources = ["app/dashboard/courses/page.tsx", "components/dashboard/batch-form.tsx", "components/dashboard/courses-batches-client.tsx"].map((file) => readFileSync(file, "utf8")).join("\n")
    expect(sources).not.toContain("localStorage")
    expect(sources).not.toContain("Batch A")
    expect(sources).not.toContain("Date.now()")
  })
})
