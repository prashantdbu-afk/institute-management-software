"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getBranches, getTeacherDetails, updateProfile } from "@/lib/supabase/queries"
import { getUserErrorMessage, mapProfileRow, userFormSchema, type UserViewModel } from "@/lib/users/model"

type Result = { ok: true; user: UserViewModel; invitationSent?: boolean } | { ok: false; error: string }

async function validateBranch(role: string, branchId: string | null) {
  if (role === "admin") return branchId === null
  return !!branchId && (await getBranches()).some((branch) => branch.id === branchId)
}

export async function provisionUserAction(input: unknown): Promise<Result> {
  await requireRole(["admin"])
  const parsed=userFormSchema.safeParse(input); if(!parsed.success) return {ok:false,error:parsed.error.issues[0]?.message ?? "Invalid user details."}
  if(parsed.data.role==="teacher") return {ok:false,error:"Provision teachers from the Teachers page so required faculty details are created."}
  if(!(await validateBranch(parsed.data.role,parsed.data.branchId))) return {ok:false,error:"Select a valid branch for this role."}
  let createdId: string | null = null
  try {
    const admin=createAdminClient()
    const {data,error}=await admin.auth.admin.inviteUserByEmail(parsed.data.email,{data:{first_name:parsed.data.fullName}})
    if(error||!data.user) throw error ?? new Error("Invitation did not create an Auth user")
    createdId=data.user.id
    const {data:profile,error:profileError}=await admin.from("profiles").update({email:parsed.data.email,full_name:parsed.data.fullName,phone:parsed.data.phone||null,role:parsed.data.role,branch_id:parsed.data.branchId,status:parsed.data.status}).eq("id",createdId).select("id, email, full_name, phone, role, branch_id, status, created_at, updated_at").single()
    if(profileError||!profile) throw profileError ?? new Error("Profile configuration failed")
    const branches=await getBranches(); revalidatePath("/dashboard/users")
    return {ok:true,user:mapProfileRow(profile,branches),invitationSent:true}
  } catch(error) {
    let rollbackFailed=false
    if(createdId) { try { const {error:rollbackError}=await createAdminClient().auth.admin.deleteUser(createdId); rollbackFailed=!!rollbackError } catch { rollbackFailed=true } }
    if(rollbackFailed) return {ok:false,error:"Provisioning failed and automatic rollback also failed. Remove the incomplete invited user from Supabase Auth before retrying."}
    const message=error instanceof Error && error.message.includes("SUPABASE_SERVICE_ROLE_KEY") ? "User invitations require the server-only SUPABASE_SERVICE_ROLE_KEY." : getUserErrorMessage(error,"provision")
    return {ok:false,error:message}
  }
}

export async function updateUserAction(id:string,input:unknown):Promise<Result>{
  const actor=await requireRole(["admin"]); if(!z.string().uuid().safeParse(id).success) return {ok:false,error:"Invalid user identifier."}; if(actor.id===id) return {ok:false,error:"Use a separate administrator to change your own access settings."}
  const parsed=userFormSchema.safeParse(input); if(!parsed.success) return {ok:false,error:parsed.error.issues[0]?.message??"Invalid user details."}; if(!(await validateBranch(parsed.data.role,parsed.data.branchId))) return {ok:false,error:"Select a valid branch for this role."}
  const teacherDetail=(await getTeacherDetails()).find((detail)=>detail.teacher_id===id)
  const isTeacher=!!teacherDetail
  if(parsed.data.role==="teacher"&&!isTeacher) return {ok:false,error:"Convert users to teachers through a dedicated provisioning workflow."}
  if(isTeacher&&parsed.data.role!=="teacher") return {ok:false,error:"Archive the teacher record before changing this role."}
  if(teacherDetail&&parsed.data.branchId!==teacherDetail.branch_id) return {ok:false,error:"Teacher branch reassignment requires a dedicated migration workflow and is not available here."}
  try { const profile=await updateProfile(id,{full_name:parsed.data.fullName,phone:parsed.data.phone||null,role:parsed.data.role,branch_id:parsed.data.branchId,status:parsed.data.status}); const branches=await getBranches(); revalidatePath("/dashboard/users"); revalidatePath("/dashboard/teachers"); return {ok:true,user:mapProfileRow(profile,branches)} } catch(error){ return {ok:false,error:getUserErrorMessage(error,"update")} }
}
