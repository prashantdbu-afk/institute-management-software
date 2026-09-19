import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { canAssignRole, filterUsers, mapProfileRow, userFormSchema } from "../../lib/users/model"

const branch={id:"11111111-1111-4111-8111-111111111111",name:"Main"}
const profile={id:"22222222-2222-4222-8222-222222222222",email:"user@example.com",full_name:"User Name",phone:null,role:"teacher" as const,branch_id:branch.id,status:"active" as const,created_at:null,updated_at:null}
describe("authoritative users",()=>{
  it("maps profiles and branch UUIDs",()=>{const user=mapProfileRow(profile,[branch]);expect(user.branchName).toBe("Main");expect(user.phone).toBe("")})
  it("validates role and branch requirements",()=>{expect(userFormSchema.safeParse({fullName:"A",email:"a@b.com",phone:"",role:"teacher",branchId:null,status:"active"}).success).toBe(false);expect(userFormSchema.safeParse({fullName:"A",email:"a@b.com",phone:"",role:"invalid",branchId:branch.id,status:"active"}).success).toBe(false)})
  it("allows only admins to assign roles",()=>{expect(canAssignRole({...profile,branchId:null,fullName:"Admin",role:"admin",status:"active"},"teacher")).toBe(true);expect(canAssignRole({...profile,branchId:branch.id,fullName:"Manager",role:"branch_manager",status:"active"},"admin")).toBe(false)})
  it("searches real profile fields",()=>expect(filterUsers([mapProfileRow(profile,[branch])],"main","teacher")).toHaveLength(1))
  it("removes Users localStorage and demo identities",()=>{const source=[readFileSync("app/dashboard/users/page.tsx","utf8"),readFileSync("components/dashboard/users-client.tsx","utf8"),readFileSync("components/dashboard/user-form.tsx","utf8")].join("\n");expect(source).not.toContain("localStorage");expect(source).not.toContain("admin@institute.com");expect(source).not.toContain("Date.now()")})
})
