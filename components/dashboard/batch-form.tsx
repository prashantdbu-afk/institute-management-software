"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { batchFormSchema, type BatchFormData, type BatchViewModel } from "@/lib/batches/model"
import type { CourseViewModel, TeacherOption } from "@/lib/courses/model"

interface BatchFormProps {
  initialData?: BatchViewModel | null
  courses: CourseViewModel[]
  teachers: TeacherOption[]
  onSubmit: (data: BatchFormData) => Promise<void> | void
  isSubmitting?: boolean
  error?: string
}

export function BatchForm({ initialData, courses, teachers, onSubmit, isSubmitting = false, error = "" }: BatchFormProps) {
  const [formData, setFormData] = useState<BatchFormData>({
    name: initialData?.name ?? "",
    courseId: initialData?.courseId ?? courses[0]?.id ?? "",
    startDate: initialData?.startDate ?? "",
    endDate: initialData?.endDate ?? "",
    teacherId: initialData?.teacherId ?? null,
    capacity: initialData?.capacity ?? 30,
  })
  const [validationError, setValidationError] = useState("")
  const selectedCourse = courses.find((course) => course.id === formData.courseId)
  const availableTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.branchId === selectedCourse?.branchId),
    [selectedCourse?.branchId, teachers],
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((current) => {
      if (name === "capacity") return { ...current, capacity: Number(value) }
      if (name === "teacherId") return { ...current, teacherId: value || null }
      if (name === "courseId") return { ...current, courseId: value, teacherId: null }
      return { ...current, [name]: value }
    })
    setValidationError("")
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = batchFormSchema.safeParse(formData)
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Please check the batch details.")
      return
    }
    await onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(validationError || error) ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{validationError || error}</div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="batch-name" className="text-sm font-medium">Batch Name *</label>
        <Input id="batch-name" name="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="space-y-2">
        <label htmlFor="batch-course" className="text-sm font-medium">Course *</label>
        <select id="batch-course" name="courseId" value={formData.courseId} onChange={handleChange} required disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2">
          <option value="">Select course</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.name} — {course.branchName}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="batch-teacher" className="text-sm font-medium">Teacher</label>
        <select id="batch-teacher" name="teacherId" value={formData.teacherId ?? ""} onChange={handleChange} disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2">
          <option value="">Unassigned</option>
          {availableTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><label htmlFor="batch-start" className="text-sm font-medium">Start Date</label><Input id="batch-start" name="startDate" type="date" value={formData.startDate} onChange={handleChange} disabled={isSubmitting} /></div>
        <div className="space-y-2"><label htmlFor="batch-end" className="text-sm font-medium">End Date</label><Input id="batch-end" name="endDate" type="date" value={formData.endDate} onChange={handleChange} disabled={isSubmitting} /></div>
      </div>
      <div className="space-y-2">
        <label htmlFor="batch-capacity" className="text-sm font-medium">Capacity *</label>
        <Input id="batch-capacity" name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting || courses.length === 0}>
        {isSubmitting ? "Saving..." : initialData ? "Update Batch" : "Add Batch"}
      </Button>
    </form>
  )
}
