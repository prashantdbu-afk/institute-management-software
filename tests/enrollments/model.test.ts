import { describe, expect, it } from "vitest"
import { hasDuplicateAdmissionEnrollment, isEnrollmentBranchConsistent } from "../../lib/enrollments/model"

const row = { id: "11111111-1111-4111-8111-111111111111", student_id: null, admission_id: "22222222-2222-4222-8222-222222222222", branch_id: "33333333-3333-4333-8333-333333333333", course_id: "44444444-4444-4444-8444-444444444444", batch_id: "55555555-5555-4555-8555-555555555555", status: "active" as const, enrollment_date: "2026-01-01", created_at: "2026-01-01", updated_at: "2026-01-01" }

describe("enrollment model", () => {
  it("detects duplicate admission enrollments", () => { expect(hasDuplicateAdmissionEnrollment([row, { ...row, id: "66666666-6666-4666-8666-666666666666" }])).toBe(true) })
  it("validates the branch/course/batch relationship", () => {
    expect(isEnrollmentBranchConsistent(row, [{ id: row.course_id, branchId: row.branch_id }], [{ id: row.batch_id, courseId: row.course_id, branchId: row.branch_id }])).toBe(true)
  })
})
