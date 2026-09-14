export const roles = ["admin", "branch_manager", "teacher", "student"] as const

export type UserRole = (typeof roles)[number]

export interface AuthoritativeUser {
  id: string
  email: string
  role: UserRole
  branchId: string | null
  fullName: string | null
}

const dashboardAccess: Record<UserRole, readonly string[]> = {
  admin: ["*"],
  branch_manager: ["", "courses", "students", "teachers", "admissions", "timetable", "fees", "stock", "homework", "test-results"],
  teacher: ["", "timetable", "homework", "test-results", "classes", "assignments"],
  student: ["", "timetable", "fees", "homework", "test-results", "assignments"],
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && roles.includes(value as UserRole)
}

export function canAccessDashboardPath(role: UserRole, pathname: string) {
  const segment = pathname.replace(/^\/dashboard\/?/, "").split("/")[0]
  const allowed = dashboardAccess[role]
  return allowed.includes("*") || allowed.includes(segment)
}

export type DashboardDecision = "allow" | "unauthenticated" | "invalid-profile" | "forbidden"

export function authorizeDashboardRequest(
  isAuthenticated: boolean,
  role: UserRole | null,
  pathname: string,
): DashboardDecision {
  if (!isAuthenticated) return "unauthenticated"
  if (!role) return "invalid-profile"
  if (!canAccessDashboardPath(role, pathname)) return "forbidden"
  return "allow"
}
