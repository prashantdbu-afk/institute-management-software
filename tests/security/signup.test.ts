import { describe, expect, it } from "vitest"
import { publicSignupSchema } from "../../lib/auth/signup"

const validSignup = {
  email: "student@example.com",
  password: "a-secure-password",
  firstName: "Student",
  lastName: "User",
}

describe("public signup", () => {
  it("accepts a student signup without a role field", () => {
    expect(publicSignupSchema.parse(validSignup)).toEqual(validSignup)
  })

  it.each(["admin", "branch_manager", "teacher"])("rejects a requested %s role", (role) => {
    expect(() => publicSignupSchema.parse({ ...validSignup, role })).toThrow()
  })
})
