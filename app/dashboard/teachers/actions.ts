"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { requireRole } from "@/lib/auth/server"
import { createAdminClient, inviteAuthUser } from "@/lib/supabase/admin"
import { getBranches, getCourses, getProfiles, getTeacherAssignments, getTeacherDetails, replaceTeacherAssignments, updateTeacherIdentity, upsertTeacherDetail } from "@/lib/supabase/queries"
import { getTeacherErrorMessage, mapTeacher, teacherFormSchema, validateAssignmentBranches, type TeacherViewModel } from "@/lib/teachers/model"

type Result={ok:true;teacher:TeacherViewModel;invitationSent?:boolean}|{ok:false;error:string}
async function inviteRedirectUrl(){const origin=(await headers()).get("origin");if(!origin||!/^https?:\/\//.test(origin))throw new Error("Unable to determine the application URL");return new URL("/auth/invite",origin).toString()}
async function references(){ const [branches,courses]=await Promise.all([getBranches(),getCourses()]); return {branches,courses:courses.map(c=>({id:c.id,name:c.name,branchId:c.branch_id??""}))} }
async function mappedTeacher(id:string){ const [profiles,details,assignments,refs]=await Promise.all([getProfiles(),getTeacherDetails(),getTeacherAssignments(),references()]); return mapTeacher(profiles.find(p=>p.id===id),details.find(d=>d.teacher_id===id),assignments,refs.branches,refs.courses) }

export async function provisionTeacherAction(input:unknown):Promise<Result>{
  await requireRole(["admin"]); const parsed=teacherFormSchema.safeParse(input); if(!parsed.success)return{ok:false,error:parsed.error.issues[0]?.message??"Invalid teacher details."}; const refs=await references(); if(!refs.branches.some(b=>b.id===parsed.data.branchId)||!validateAssignmentBranches(parsed.data.branchId,parsed.data.courseIds,refs.courses))return{ok:false,error:"Teacher and assigned courses must belong to the selected branch."}
  let createdId:string|null=null
  try { const admin=createAdminClient(); const invitation=await inviteAuthUser(parsed.data.email,parsed.data.fullName,await inviteRedirectUrl()); createdId=invitation.user.id
    const {error:profileError}=await admin.from("profiles").update({full_name:parsed.data.fullName,phone:parsed.data.phone||null,role:"teacher",branch_id:parsed.data.branchId,status:"active"}).eq("id",createdId); if(profileError)throw profileError
    const {error:detailError}=await admin.from("teacher_details").insert({teacher_id:createdId,branch_id:parsed.data.branchId,qualification:parsed.data.qualification||null,specialization:parsed.data.specialization||null,experience_years:parsed.data.experienceYears,status:parsed.data.status,joining_date:parsed.data.joiningDate}); if(detailError)throw detailError
    if(parsed.data.courseIds.length){const {error:assignmentError}=await admin.from("teacher_course_assignments").insert(parsed.data.courseIds.map(course_id=>({teacher_id:createdId,course_id,branch_id:parsed.data.branchId,status:"active"})));if(assignmentError)throw assignmentError}
    revalidatePath("/dashboard/teachers"); revalidatePath("/dashboard/users"); return{ok:true,teacher:await mappedTeacher(createdId),invitationSent:invitation.invitationSent}
  }catch(error){let rollbackFailed=false;if(createdId){try{const admin=createAdminClient();await admin.from("teacher_course_assignments").delete().eq("teacher_id",createdId);await admin.from("teacher_details").delete().eq("teacher_id",createdId);const {error:rollbackError}=await admin.auth.admin.deleteUser(createdId);rollbackFailed=!!rollbackError}catch{rollbackFailed=true}}if(rollbackFailed)return{ok:false,error:"Provisioning failed and automatic rollback also failed. Remove the incomplete teacher from Supabase before retrying."};const message=error instanceof Error&&error.message.includes("SUPABASE_SERVICE_ROLE_KEY")?"Teacher invitations require the server-only SUPABASE_SERVICE_ROLE_KEY.":getTeacherErrorMessage(error,"provision");return{ok:false,error:message}}
}

export async function updateTeacherAction(id:string,input:unknown):Promise<Result>{
  const actor=await requireRole(["admin","branch_manager"]); if(!z.string().uuid().safeParse(id).success)return{ok:false,error:"Invalid teacher identifier."}; const parsed=teacherFormSchema.safeParse(input);if(!parsed.success)return{ok:false,error:parsed.error.issues[0]?.message??"Invalid teacher details."}; const refs=await references();if(!validateAssignmentBranches(parsed.data.branchId,parsed.data.courseIds,refs.courses))return{ok:false,error:"Assigned courses must belong to the teacher branch."}
  const existing=(await getTeacherDetails()).find(detail=>detail.teacher_id===id);if(!existing||!(actor.role==="admin"||(actor.branchId===existing.branch_id&&parsed.data.branchId===existing.branch_id)))return{ok:false,error:"You do not have permission to move or manage this teacher."}
  try{await updateTeacherIdentity(id,parsed.data.fullName,parsed.data.phone);await upsertTeacherDetail({teacher_id:id,branch_id:parsed.data.branchId,qualification:parsed.data.qualification||null,specialization:parsed.data.specialization||null,experience_years:parsed.data.experienceYears,status:parsed.data.status,joining_date:parsed.data.joiningDate});await replaceTeacherAssignments(id,parsed.data.branchId,parsed.data.courseIds);revalidatePath("/dashboard/teachers");return{ok:true,teacher:await mappedTeacher(id)}}catch(error){return{ok:false,error:getTeacherErrorMessage(error,"update")}}
}

export async function archiveTeacherAction(id:string):Promise<{ok:true;teacher:TeacherViewModel}|{ok:false;error:string}>{ const actor=await requireRole(["admin","branch_manager"]);if(!z.string().uuid().safeParse(id).success)return{ok:false,error:"Invalid teacher identifier."};const existing=(await getTeacherDetails()).find(d=>d.teacher_id===id);if(!existing||!(actor.role==="admin"||actor.branchId===existing.branch_id))return{ok:false,error:"You do not have permission to archive this teacher."};try{await upsertTeacherDetail({...existing,status:"inactive"});await replaceTeacherAssignments(id,existing.branch_id,[]);revalidatePath("/dashboard/teachers");return{ok:true,teacher:await mappedTeacher(id)}}catch(error){return{ok:false,error:getTeacherErrorMessage(error,"archive")}}
}
