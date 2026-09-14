import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  canManageBranch,
  canManageCourses,
  courseDatabaseRowSchema,
  courseFormSchema,
  filterCourses,
  getCourseErrorMessage,
  mapCourseRow,
  replaceCourse,
  toCoursePayload,
  type CourseViewModel,
} from "../../lib/courses/model"

const course: CourseViewModel = {
  id: "11111111-1111-4111-8111-111111111111", name: "TypeScript", description: "Typed web apps", level: "Intermediate",
  durationHours: 24, instructorId: null, price: 1200, branchId: "22222222-2222-4222-8222-222222222222",
  instructorName: null, branchName: "Central", createdAt: null, updatedAt: null,
}

describe("course mapping and validation", () => {
  it("maps database columns and decimal prices without fake enrollments", () => {
    const row = courseDatabaseRowSchema.parse({ id: course.id, name: course.name, description: null, level: "Intermediate", duration_hours: 24, instructor_id: null, price: "1200.00", branch_id: course.branchId, created_at: null, updated_at: null })
    const mapped = mapCourseRow(row, [{ id: course.branchId, name: "Central" }], [])
    expect(mapped).toMatchObject({ price: 1200, branchName: "Central", instructorName: null })
    expect(mapped).not.toHaveProperty("enrolledStudents")
    expect(mapped).not.toHaveProperty("maxStudents")
  })

  it("trims and converts a valid create payload", () => {
    const parsed = courseFormSchema.parse({ ...course, name: "  TypeScript  ", description: "  Typed web apps  " })
    expect(toCoursePayload(parsed)).toMatchObject({ name: "TypeScript", description: "Typed web apps", branch_id: course.branchId, instructor_id: null })
  })

  it("rejects invalid update values", () => {
    expect(courseFormSchema.safeParse({ ...course, durationHours: -1 }).success).toBe(false)
    expect(courseFormSchema.safeParse({ ...course, branchId: "not-a-uuid" }).success).toBe(false)
  })
})

describe("course behavior and access", () => {
  it("enforces authoritative branch management", () => {
    const manager = { id: "u", email: "m@example.com", role: "branch_manager" as const, branchId: course.branchId, fullName: null, status: "active" as const }
    expect(canManageBranch(manager, course.branchId)).toBe(true)
    expect(canManageBranch(manager, "33333333-3333-4333-8333-333333333333")).toBe(false)
    expect(canManageCourses("admin")).toBe(true)
    expect(canManageCourses("branch_manager")).toBe(true)
    expect(canManageCourses("teacher")).toBe(false)
    expect(canManageCourses("student")).toBe(false)
  })

  it("filters and replaces by database identity", () => {
    expect(filterCourses([course], "central", "Intermediate")).toEqual([course])
    expect(replaceCourse([course], { ...course, name: "Updated" })[0]?.name).toBe("Updated")
  })

  it("handles dependent-record deletion safely", () => {
    expect(getCourseErrorMessage({ code: "23503", detail: "private" }, "delete")).toBe("This course cannot be deleted because related records exist.")
  })

  it("removes course localStorage, generated IDs, and demo records from the migrated path", () => {
    const sources = ["app/dashboard/courses/page.tsx", "components/dashboard/course-form.tsx", "components/dashboard/courses-batches-client.tsx"].map((file) => readFileSync(file, "utf8")).join("\n")
    expect(sources).not.toContain("localStorage")
    expect(sources).not.toContain("Date.now()")
    expect(sources).not.toContain("Web Development")
    expect(sources).not.toContain("Python Basics")
    expect(sources).not.toContain("Advanced React")
  })
})
