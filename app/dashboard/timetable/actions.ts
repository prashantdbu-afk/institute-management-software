"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/server"
import { canManageTimetable, getTimetableErrorMessage, mapTimetableRow, timetableFormSchema, toTimetablePayload, validateTimetableRelationships, type TimetableViewModel } from "@/lib/timetable/model"
import { createTimetableEntry, deleteTimetableEntry, getTimetableEntry, getTimetableReferences, updateTimetableEntry } from "@/lib/supabase/queries"

type MutationResult={ok:true;entry:TimetableViewModel}|{ok:false;error:string}
type DeleteResult={ok:true}|{ok:false;error:string}

async function validateInput(input:unknown){const parsed=timetableFormSchema.safeParse(input);if(!parsed.success)return{ok:false as const,error:parsed.error.issues[0]?.message??"Invalid schedule."};const refs=await getTimetableReferences();if(!validateTimetableRelationships(parsed.data,refs))return{ok:false as const,error:"The selected branch, course, batch, and teacher assignment do not belong together."};return{ok:true as const,data:parsed.data,refs}}

export async function createTimetableAction(input:unknown):Promise<MutationResult>{
  const user=await requireRole(["admin","branch_manager"])
  try{const checked=await validateInput(input);if(!checked.ok)return checked;if(!canManageTimetable(user,checked.data.branchId))return{ok:false,error:"You cannot manage schedules in this branch."};const row=await createTimetableEntry(toTimetablePayload(checked.data));revalidatePath("/dashboard/timetable");return{ok:true,entry:mapTimetableRow(row,checked.refs)}}catch(error){return{ok:false,error:getTimetableErrorMessage(error,"create")}}
}

export async function updateTimetableAction(id:string,input:unknown):Promise<MutationResult>{
  const user=await requireRole(["admin","branch_manager"])
  if(!z.string().uuid().safeParse(id).success)return{ok:false,error:"Invalid schedule identifier."}
  try{const current=await getTimetableEntry(id);if(!canManageTimetable(user,current.branch_id))return{ok:false,error:"You cannot manage schedules in this branch."};const checked=await validateInput(input);if(!checked.ok)return checked;if(!canManageTimetable(user,checked.data.branchId))return{ok:false,error:"You cannot move schedules to this branch."};const row=await updateTimetableEntry(id,toTimetablePayload(checked.data));revalidatePath("/dashboard/timetable");return{ok:true,entry:mapTimetableRow(row,checked.refs)}}catch(error){return{ok:false,error:getTimetableErrorMessage(error,"update")}}
}

export async function deleteTimetableAction(id:string):Promise<DeleteResult>{
  const user=await requireRole(["admin","branch_manager"])
  if(!z.string().uuid().safeParse(id).success)return{ok:false,error:"Invalid schedule identifier."}
  try{const current=await getTimetableEntry(id);if(!canManageTimetable(user,current.branch_id))return{ok:false,error:"You cannot manage schedules in this branch."};await deleteTimetableEntry(id);revalidatePath("/dashboard/timetable");return{ok:true}}catch(error){return{ok:false,error:getTimetableErrorMessage(error,"delete")}}
}
