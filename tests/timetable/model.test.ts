import { describe,expect,it } from "vitest"
import { canManageTimetable,mapTimetableRow,overlaps,timetableFormSchema,toTimetablePayload,validateTimetableRelationships,type TimetableReferences } from "../../lib/timetable/model"

const ids={branch:"11111111-1111-4111-8111-111111111111",course:"22222222-2222-4222-8222-222222222222",batch:"33333333-3333-4333-8333-333333333333",teacher:"44444444-4444-4444-8444-444444444444",row:"55555555-5555-4555-8555-555555555555"}
const refs:TimetableReferences={branches:[{id:ids.branch,name:"Pune"}],courses:[{id:ids.course,name:"TypeScript",branchId:ids.branch}],batches:[{id:ids.batch,name:"Morning",courseId:ids.course,branchId:ids.branch}],teachers:[{id:ids.teacher,name:"Asha",branchId:ids.branch}],assignments:[{teacherId:ids.teacher,courseId:ids.course,branchId:ids.branch}]}
const form={branchId:ids.branch,courseId:ids.course,batchId:ids.batch,teacherId:ids.teacher,day:"Monday" as const,startTime:"09:00",endTime:"10:00",room:"Lab 1"}

describe("timetable model",()=>{
  it("validates and maps create payloads",()=>expect(toTimetablePayload(form)).toEqual({branch_id:ids.branch,course_id:ids.course,batch_id:ids.batch,teacher_id:ids.teacher,day_of_week:"Monday",start_time:"09:00",end_time:"10:00",room_number:"Lab 1"}))
  it("rejects invalid times",()=>expect(timetableFormSchema.safeParse({...form,endTime:"08:59"}).success).toBe(false))
  it("validates branch/course consistency",()=>{expect(validateTimetableRelationships(form,refs)).toBe(true);expect(validateTimetableRelationships({...form,branchId:ids.row},refs)).toBe(false)})
  it("validates course/batch consistency",()=>expect(validateTimetableRelationships({...form,batchId:ids.row},refs)).toBe(false))
  it("validates teacher/branch and teacher/course assignment",()=>{expect(validateTimetableRelationships({...form,teacherId:ids.row},refs)).toBe(false);expect(validateTimetableRelationships(form,{...refs,assignments:[]})).toBe(false)})
  it("maps database rows",()=>expect(mapTimetableRow({id:ids.row,day_of_week:"Monday",start_time:"09:00:00",end_time:"10:00:00",course_id:ids.course,batch_id:ids.batch,teacher_id:ids.teacher,room_number:"Lab 1",branch_id:ids.branch,created_at:null,updated_at:null},refs).teacherName).toBe("Asha"))
  it("detects teacher, batch, and room overlap semantics",()=>{expect(overlaps("09:00","10:00","09:30","10:30")).toBe(true);expect(overlaps("09:00","10:00","10:00","11:00")).toBe(false)})
  it("authorizes admin and own-branch manager only",()=>{expect(canManageTimetable({id:ids.teacher,email:"admin@example.com",role:"admin",branchId:null,fullName:null,status:"active"},ids.branch)).toBe(true);expect(canManageTimetable({id:ids.teacher,email:"manager@example.com",role:"branch_manager",branchId:ids.branch,fullName:null,status:"active"},ids.branch)).toBe(true);expect(canManageTimetable({id:ids.teacher,email:"manager@example.com",role:"branch_manager",branchId:ids.row,fullName:null,status:"active"},ids.branch)).toBe(false);expect(canManageTimetable({id:ids.teacher,email:"teacher@example.com",role:"teacher",branchId:ids.branch,fullName:null,status:"active"},ids.branch)).toBe(false)})
})
