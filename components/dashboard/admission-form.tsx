"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { admissionFormSchema, type AdmissionFormData, type AdmissionViewModel } from "@/lib/admissions/model"
import type { BatchViewModel } from "@/lib/batches/model"
import type { BranchOption, CourseViewModel } from "@/lib/courses/model"

interface Props {
  initialData?: AdmissionViewModel | null
  branches: BranchOption[]
  courses: CourseViewModel[]
  batches: BatchViewModel[]
  isSubmitting: boolean
  onSubmit: (data: AdmissionFormData) => Promise<void>
}

const emptyForm: AdmissionFormData = { studentName: "", parentName: "", email: "", phone: "", dob: "", address: "", branchId: "", courseId: "", batchId: "", notes: "" }

export function AdmissionForm({ initialData, branches, courses, batches, isSubmitting, onSubmit }: Props) {
  const [data, setData] = useState<AdmissionFormData>(initialData ?? { ...emptyForm, branchId: branches[0]?.id ?? "" })
  const [error, setError] = useState("")
  const availableCourses = useMemo(() => courses.filter((item) => item.branchId === data.branchId), [courses, data.branchId])
  const availableBatches = useMemo(() => batches.filter((item) => item.branchId === data.branchId && item.courseId === data.courseId), [batches, data.branchId, data.courseId])
  const change = (name: keyof AdmissionFormData, value: string) => {
    setError("")
    setData((current) => name === "branchId" ? { ...current, branchId: value, courseId: "", batchId: "" } : name === "courseId" ? { ...current, courseId: value, batchId: "" } : { ...current, [name]: value })
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = admissionFormSchema.safeParse(data)
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the admission details.")
    await onSubmit(parsed.data)
  }

  return <form onSubmit={submit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
    {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <Field label="Student Name" required><Input value={data.studentName} onChange={(e) => change("studentName", e.target.value)} required /></Field>
    <Field label="Parent/Guardian Name"><Input value={data.parentName} onChange={(e) => change("parentName", e.target.value)} /></Field>
    <Field label="Email" required><Input type="email" value={data.email} onChange={(e) => change("email", e.target.value)} required /></Field>
    <Field label="Phone"><Input value={data.phone} onChange={(e) => change("phone", e.target.value)} /></Field>
    <Field label="Date of Birth"><Input type="date" value={data.dob} onChange={(e) => change("dob", e.target.value)} /></Field>
    <Field label="Address"><Input value={data.address} onChange={(e) => change("address", e.target.value)} /></Field>
    <Field label="Branch" required><select className="w-full rounded-md border border-input bg-background px-3 py-2" value={data.branchId} onChange={(e) => change("branchId", e.target.value)} required><option value="">Select a branch</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Course" required><select className="w-full rounded-md border border-input bg-background px-3 py-2" value={data.courseId} onChange={(e) => change("courseId", e.target.value)} required disabled={!data.branchId}><option value="">Select a course</option>{availableCourses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Batch" required><select className="w-full rounded-md border border-input bg-background px-3 py-2" value={data.batchId} onChange={(e) => change("batchId", e.target.value)} required disabled={!data.courseId}><option value="">Select a batch</option>{availableBatches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
    <Field label="Notes"><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={data.notes} onChange={(e) => change("notes", e.target.value)} /></Field>
    <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Saving..." : initialData ? "Update Admission" : "Submit Application"}</Button>
  </form>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}{required ? " *" : ""}</span>{children}</label>
}
