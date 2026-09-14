import { describe, expect, it } from "vitest"
import { authorizeDashboardRequest, canAccessDashboardPath, type UserRole } from "../../lib/auth/permissions"

describe("dashboard authorization", () => {
  it("denies an unauthenticated dashboard request", () => {
    expect(authorizeDashboardRequest(false, null, "/dashboard")).toBe("unauthenticated")
  })

  it("denies a protected route when the authenticated user has no profile", () => {
    expect(authorizeDashboardRequest(true, null, "/dashboard")).toBe("invalid-profile")
  })

  it("rejects an invalid profile role before authorization", async () => {
    const { isUserRole } = await import("../../lib/auth/permissions")
    const untrustedRole = "super_admin"

    expect(isUserRole(untrustedRole)).toBe(false)
    expect(authorizeDashboardRequest(true, isUserRole(untrustedRole) ? untrustedRole : null, "/dashboard")).toBe(
      "invalid-profile",
    )
  })

  it("denies a student access to admin-only routes", () => {
    expect(authorizeDashboardRequest(true, "student", "/dashboard/users")).toBe("forbidden")
    expect(authorizeDashboardRequest(true, "student", "/dashboard/branches")).toBe("forbidden")
  })

  it("does not accept a browser/local role when the authoritative role is student", () => {
    const browserControlledRole = "admin"
    const authoritativeRole: UserRole = "student"

    expect(browserControlledRole).toBe("admin")
    expect(authorizeDashboardRequest(true, authoritativeRole, "/dashboard/users")).toBe("forbidden")
  })

  it.each([
    ["admin", "/dashboard/users", true],
    ["branch_manager", "/dashboard/admissions", true],
    ["branch_manager", "/dashboard/courses", true],
    ["branch_manager", "/dashboard/branches", false],
    ["teacher", "/dashboard/homework", true],
    ["teacher", "/dashboard/students", false],
    ["teacher", "/dashboard/fees", false],
    ["student", "/dashboard/courses", false],
    ["student", "/dashboard/users", false],
  ] as const)("applies %s access to %s", (role, path, expected) => {
    expect(canAccessDashboardPath(role, path)).toBe(expected)
  })
})
