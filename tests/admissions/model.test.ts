import { describe, expect, it } from "vitest"
import { admissionFormSchema, canTransitionAdmission, filterAdmissions, isAdmissionRelationshipConsistent, mapAdmissionRow, toAdmissionPayload } from "../../lib/admissions/model"

const form = { studentName: "Ada Lovelace", parentName: "", email: "ada@example.com", phone: "555-123-4567", dob: "2008-01-01", address: "1 Test St", branchId: "11111111-1111-4111-8111-111111111111", courseId: "22222222-2222-4222-8222-222222222222", batchId: "33333333-3333-4333-8333-333333333333", notes: "" }

describe("admissions model", () => {
  it("validates real relational identifiers and forces new records to pending", () => {
    expect(admissionFormSchema.safeParse(form).success).toBe(true)
    expect(toAdmissionPayload(form).status).toBe("pending")
  })
  it("rejects inconsistent branch/course/batch selections", () => {
    expect(isAdmissionRelationshipConsistent(form, [{ id: form.courseId, name: "Course", branchId: form.branchId }], [{ id: form.batchId, name: "Batch", courseId: form.courseId, branchId: form.branchId }])).toBe(true)
    expect(isAdmissionRelationshipConsistent(form, [{ id: form.courseId, name: "Course", branchId: "44444444-4444-4444-8444-444444444444" }], [{ id: form.batchId, name: "Batch", courseId: form.courseId, branchId: form.branchId }])).toBe(false)
  })
  it("allows only terminal transitions from pending and never reverses enrollment", () => {
    expect(canTransitionAdmission("pending", "approved", false)).toBe(true)
    expect(canTransitionAdmission("rejected", "approved", false)).toBe(false)
    expect(canTransitionAdmission("approved", "rejected", true)).toBe(false)
  })
  it("filters by status and text", () => {
    const item = { ...form, id: form.branchId, branchName: "Main", courseName: "Course", batchName: "Batch", status: "pending" as const, appliedDate: "2026-01-01", enrollmentDate: null, createdAt: null, updatedAt: null }
    expect(filterAdmissions([item], "ada", "pending")).toHaveLength(1)
    expect(filterAdmissions([item], "ada", "approved")).toHaveLength(0)
  })
  it("maps database relationships to display names without using them as identity", () => {
    const row = { id: form.branchId, student_name: form.studentName, parent_name: null, email: form.email, phone: null, dob: null, address: null, branch_id: form.branchId, course_id: form.courseId, batch_id: form.batchId, status: "pending" as const, notes: null, enrollment_date: null, created_at: "2026-01-01T00:00:00Z", updated_at: null }
    const mapped = mapAdmissionRow(row, [{ id: form.branchId, name: "Main" }], [{ id: form.courseId, name: "TypeScript", branchId: form.branchId }], [{ id: form.batchId, name: "Morning", branchId: form.branchId, courseId: form.courseId }])
    expect(mapped).toMatchObject({ branchId: form.branchId, branchName: "Main", courseName: "TypeScript", batchName: "Morning" })
  })
})
