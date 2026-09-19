import { z } from "zod"
import type { AuthoritativeUser } from "../auth/permissions"

export const timetableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time")

export const timetableDatabaseRowSchema = z.object({
  id: z.string().uuid(), day_of_week: z.enum(timetableDays), start_time: z.string(), end_time: z.string(),
  course_id: z.string().uuid(), batch_id: z.string().uuid(), teacher_id: z.string().uuid(),
  room_number: z.string().nullable(), branch_id: z.string().uuid(), created_at: z.string().nullable(), updated_at: z.string().nullable(),
})
export type TimetableDatabaseRow = z.infer<typeof timetableDatabaseRowSchema>

export const timetableFormSchema = z.object({
  branchId: z.string().uuid("Select a valid branch"), courseId: z.string().uuid("Select a valid course"),
  batchId: z.string().uuid("Select a valid batch"), teacherId: z.string().uuid("Select a valid teacher"),
  day: z.enum(timetableDays), startTime: timeSchema, endTime: timeSchema,
  room: z.string().trim().max(100, "Room must be 100 characters or fewer"),
}).refine((value) => value.endTime > value.startTime, { message: "End time must be after start time", path: ["endTime"] })
export type TimetableFormData = z.infer<typeof timetableFormSchema>

export interface TimetableCreatePayload { branch_id:string; course_id:string; batch_id:string; teacher_id:string; day_of_week:(typeof timetableDays)[number]; start_time:string; end_time:string; room_number:string|null }
export type TimetableUpdatePayload = TimetableCreatePayload
export interface TimetableViewModel extends TimetableFormData { id:string; branchName:string; courseName:string; batchName:string; teacherName:string; createdAt:string|null; updatedAt:string|null }
export interface TimetableReferences { branches:{id:string;name:string}[]; courses:{id:string;name:string;branchId:string}[]; batches:{id:string;name:string;courseId:string;branchId:string}[]; teachers:{id:string;name:string;branchId:string}[]; assignments:{teacherId:string;courseId:string;branchId:string}[] }

export function toTimetablePayload(data: TimetableFormData): TimetableCreatePayload { const value=timetableFormSchema.parse(data); return {branch_id:value.branchId,course_id:value.courseId,batch_id:value.batchId,teacher_id:value.teacherId,day_of_week:value.day,start_time:value.startTime,end_time:value.endTime,room_number:value.room||null} }
export function mapTimetableRow(row:TimetableDatabaseRow, refs:TimetableReferences):TimetableViewModel { return {id:row.id,branchId:row.branch_id,courseId:row.course_id,batchId:row.batch_id,teacherId:row.teacher_id,day:row.day_of_week,startTime:row.start_time.slice(0,5),endTime:row.end_time.slice(0,5),room:row.room_number??"",branchName:refs.branches.find(x=>x.id===row.branch_id)?.name??"Unknown branch",courseName:refs.courses.find(x=>x.id===row.course_id)?.name??"Unknown course",batchName:refs.batches.find(x=>x.id===row.batch_id)?.name??"Unknown batch",teacherName:refs.teachers.find(x=>x.id===row.teacher_id)?.name??"Assigned teacher",createdAt:row.created_at,updatedAt:row.updated_at} }
export function validateTimetableRelationships(data:TimetableFormData, refs:TimetableReferences){return refs.courses.some(x=>x.id===data.courseId&&x.branchId===data.branchId)&&refs.batches.some(x=>x.id===data.batchId&&x.courseId===data.courseId&&x.branchId===data.branchId)&&refs.teachers.some(x=>x.id===data.teacherId&&x.branchId===data.branchId)&&refs.assignments.some(x=>x.teacherId===data.teacherId&&x.courseId===data.courseId&&x.branchId===data.branchId)}
export function canManageTimetable(user:AuthoritativeUser, branchId:string){return user.role==="admin"||(user.role==="branch_manager"&&user.branchId===branchId)}
export function overlaps(aStart:string,aEnd:string,bStart:string,bEnd:string){return aStart<bEnd&&bStart<aEnd}
export function replaceTimetableEntry(rows:TimetableViewModel[],updated:TimetableViewModel){return rows.map(row=>row.id===updated.id?updated:row)}
export function getTimetableErrorMessage(error:unknown,operation:"load"|"create"|"update"|"delete"){const value=typeof error==="object"&&error!==null?error as {code?:string;message?:string}:{};if(value.message?.includes("timetable_teacher_conflict"))return "This teacher already has a class during this time.";if(value.message?.includes("timetable_batch_conflict"))return "This batch already has a class during this time.";if(value.message?.includes("timetable_room_conflict"))return "This room is already in use during this time.";if(value.code==="42501")return "You do not have permission to manage this timetable.";if(value.code==="23503"||value.code==="23514")return "The branch, course, batch, and teacher assignment must belong together.";return `We could not ${operation==="load"?"load the timetable":`${operation} this schedule`}. Please try again.`}
