import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import {
  branchDatabaseRowSchema,
  branchFormSchema,
  canManageBranches,
  filterBranches,
  getBranchErrorMessage,
  isBranchListEmpty,
  mapBranchRow,
  replaceBranch,
  type BranchViewModel,
} from "../../lib/branches/model"

const branch: BranchViewModel = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Central Branch",
  addressLine1: "1 School Road", addressLine2:"",
  city: "Delhi",
  district:"Central Delhi",state:"Delhi",pinCode:"110001",country:"India",
  phone: "",
  email: "central@example.com",
  principalName: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: null,
}

describe("branch data mapping and validation", () => {
  it("maps nullable database values without inventing aggregate data", () => {
    const row = branchDatabaseRowSchema.parse({
      id: branch.id,
      name: branch.name,
      address: null,
      address_line_1:null,address_line_2:null,district:null,state:null,pin_code:null,country:"India",
      city: null,
      phone: null,
      email: null,
      principal_name: null,
      created_at: null,
      updated_at: null,
    })

    expect(mapBranchRow(row)).toMatchObject({ addressLine1: "", city: "", phone: "", email: "",country:"India" })
    expect(mapBranchRow(row)).not.toHaveProperty("students")
    expect(mapBranchRow(row)).not.toHaveProperty("teachers")
  })

  it("trims valid form values", () => {
    expect(branchFormSchema.parse({
      name: "  North  ",
      addressLine1: "  2 Road  ",addressLine2:"",
      city: "  Pune  ",
      district:"",state:"Maharashtra",pinCode:"411001",country:"India",phone: "  +919876543210  ",
      email: "  north@example.com  ",
    })).toEqual({ name: "North", addressLine1: "2 Road",addressLine2:"", city: "Pune",district:"",state:"Maharashtra",pinCode:"411001",country:"India", phone: "+919876543210", email: "north@example.com" })
  })

  it("rejects missing required fields and invalid email", () => {
    expect(branchFormSchema.safeParse({ name: "", addressLine1: "",addressLine2:"",city: "",district:"",state:"",pinCode:"12",country:"India",phone: "", email: "bad" }).success).toBe(false)
  })
})

describe("branch list behavior", () => {
  it("filters by name, city, or email", () => {
    expect(filterBranches([branch], "delhi")).toEqual([branch])
    expect(filterBranches([branch], "missing")).toEqual([])
  })

  it("replaces an updated branch by database id", () => {
    const updated = { ...branch, name: "Updated Branch" }
    expect(replaceBranch([branch], updated)).toEqual([updated])
  })

  it("distinguishes an empty database from empty search results", () => {
    expect(isBranchListEmpty([], "")).toBe(true)
    expect(isBranchListEmpty([branch], "missing")).toBe(false)
  })
})

describe("branch authorization and errors", () => {
  it("allows only administrators to manage branches", () => {
    expect(canManageBranches("admin")).toBe(true)
    expect(canManageBranches("branch_manager")).toBe(false)
    expect(canManageBranches("teacher")).toBe(false)
    expect(canManageBranches("student")).toBe(false)
  })

  it("turns foreign-key delete failures into a safe useful message", () => {
    expect(getBranchErrorMessage({ code: "23503", details: "secret database details" }, "delete"))
      .toBe("This branch cannot be deleted because other institute records still reference it.")
  })
})

describe("branch integration guardrails", () => {
  it("does not use localStorage or bundled demo branches", () => {
    const sources = [
      "app/dashboard/branches/page.tsx",
      "components/dashboard/branches-client.tsx",
      "components/dashboard/branch-form.tsx",
    ].map((file) => readFileSync(file, "utf8")).join("\n")

    expect(sources).not.toContain("localStorage")
    expect(sources).not.toContain("Main Campus")
    expect(sources).not.toContain("West Branch")
    expect(sources).not.toContain("Date.now()")
  })

  it("enforces admin authorization in the page and every mutation", () => {
    const page = readFileSync("app/dashboard/branches/page.tsx", "utf8")
    const actions = readFileSync("app/dashboard/branches/actions.ts", "utf8")

    expect(page).toContain('requireRole(["admin"])')
    expect(actions.match(/requireRole\(\["admin"\]\)/g)).toHaveLength(3)
  })
})
