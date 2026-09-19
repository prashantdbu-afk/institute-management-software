"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatIndianTime } from "@/lib/locale/india"
import { timetableDays, timetableFormSchema, type TimetableFormData, type TimetableReferences, type TimetableViewModel } from "@/lib/timetable/model"

interface Props{initialData?:TimetableViewModel|null;references:TimetableReferences;lockedBranchId:string|null;onSubmit:(data:TimetableFormData)=>Promise<void>|void;isSubmitting:boolean;error:string}
const times=Array.from({length:29},(_,index)=>{const minutes=8*60+index*30;return `${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(minutes%60).padStart(2,"0")}`})

export function TimetableForm({initialData,references,lockedBranchId,onSubmit,isSubmitting,error}:Props){
  const initialBranch=lockedBranchId??initialData?.branchId??references.branches[0]?.id??""
  const [data,setData]=useState<TimetableFormData>({branchId:initialBranch,courseId:initialData?.courseId??"",batchId:initialData?.batchId??"",teacherId:initialData?.teacherId??"",day:initialData?.day??"Monday",startTime:initialData?.startTime??"08:00",endTime:initialData?.endTime??"09:00",room:initialData?.room??""})
  const [validation,setValidation]=useState("")
  const courses=useMemo(()=>references.courses.filter(x=>x.branchId===data.branchId),[data.branchId,references.courses])
  const batches=useMemo(()=>references.batches.filter(x=>x.branchId===data.branchId&&x.courseId===data.courseId),[data.branchId,data.courseId,references.batches])
  const teachers=useMemo(()=>references.teachers.filter(teacher=>teacher.branchId===data.branchId&&references.assignments.some(a=>a.teacherId===teacher.id&&a.courseId===data.courseId&&a.branchId===data.branchId)),[data.branchId,data.courseId,references])
  const change=(event:ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>{const{name,value}=event.target;setData(current=>{if(name==="branchId")return{...current,branchId:value,courseId:"",batchId:"",teacherId:""};if(name==="courseId")return{...current,courseId:value,batchId:"",teacherId:""};return{...current,[name]:value}});setValidation("")}
  const submit=async(event:FormEvent)=>{event.preventDefault();const parsed=timetableFormSchema.safeParse(data);if(!parsed.success){setValidation(parsed.error.issues[0]?.message??"Check the schedule details.");return}await onSubmit(parsed.data)}
  return <form onSubmit={submit} className="space-y-4">
    {(validation||error)&&<p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{validation||error}</p>}
    <Field label="Branch" id="timetable-branch"><select id="timetable-branch" name="branchId" value={data.branchId} onChange={change} disabled={isSubmitting||!!lockedBranchId||!!initialData} required className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Select branch</option>{references.branches.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Course" id="timetable-course"><select id="timetable-course" name="courseId" value={data.courseId} onChange={change} disabled={isSubmitting} required className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Select course</option>{courses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Batch" id="timetable-batch"><select id="timetable-batch" name="batchId" value={data.batchId} onChange={change} disabled={isSubmitting} required className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Select batch</option>{batches.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    <Field label="Teacher" id="timetable-teacher"><select id="timetable-teacher" name="teacherId" value={data.teacherId} onChange={change} disabled={isSubmitting} required className="w-full rounded-md border border-input bg-background px-3 py-2"><option value="">Select assigned teacher</option>{teachers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
    <div className="grid gap-4 sm:grid-cols-3"><Field label="Day" id="timetable-day"><select id="timetable-day" name="day" value={data.day} onChange={change} disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2">{timetableDays.map(day=><option key={day}>{day}</option>)}</select></Field><Field label="Start time" id="timetable-start"><select id="timetable-start" name="startTime" value={data.startTime} onChange={change} disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2">{times.map(time=><option key={time} value={time}>{formatIndianTime(time)}</option>)}</select></Field><Field label="End time" id="timetable-end"><select id="timetable-end" name="endTime" value={data.endTime} onChange={change} disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2">{times.map(time=><option key={time} value={time}>{formatIndianTime(time)}</option>)}</select></Field></div>
    <Field label="Room / Location" id="timetable-room"><Input id="timetable-room" name="room" value={data.room} onChange={change} maxLength={100} disabled={isSubmitting}/></Field>
    <Button className="w-full" disabled={isSubmitting||references.branches.length===0}>{isSubmitting?"Saving...":initialData?"Update Schedule":"Add Schedule"}</Button>
  </form>
}
function Field({label,id,children}:{label:string;id:string;children:ReactNode}){return <div className="space-y-2"><label htmlFor={id} className="text-sm font-medium">{label} *</label>{children}</div>}
