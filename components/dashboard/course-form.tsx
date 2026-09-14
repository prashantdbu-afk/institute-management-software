"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  courseFormSchema,
  courseLevels,
  type BranchOption,
  type CourseFormData,
  type CourseViewModel,
  type TeacherOption,
} from "@/lib/courses/model"

interface CourseFormProps {
  initialData?: CourseViewModel | null
  branches: BranchOption[]
  teachers: TeacherOption[]
  onSubmit: (data: CourseFormData) => Promise<void> | void
  isSubmitting?: boolean
  error?: string
}

export function CourseForm({ initialData, branches, teachers, onSubmit, isSubmitting = false, error = "" }: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    level: initialData?.level ?? "Beginner",
    durationHours: initialData?.durationHours ?? 0,
    instructorId: initialData?.instructorId ?? null,
    price: initialData?.price ?? 0,
    branchId: initialData?.branchId ?? branches[0]?.id ?? "",
  })
  const [validationError, setValidationError] = useState("")
  const availableTeachers = useMemo(
    () => teachers.filter((teacher) => teacher.branchId === formData.branchId),
    [formData.branchId, teachers],
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((current) => {
      if (name === "durationHours" || name === "price") return { ...current, [name]: Number(value) }
      if (name === "instructorId") return { ...current, instructorId: value || null }
      if (name === "branchId") return { ...current, branchId: value, instructorId: null }
      return { ...current, [name]: value }
    })
    setValidationError("")
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = courseFormSchema.safeParse(formData)
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Please check the course details.")
      return
    }
    await onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(validationError || error) ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {validationError || error}
        </div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="course-name" className="text-sm font-medium">Course Name *</label>
        <Input id="course-name" name="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-description" className="text-sm font-medium">Description</label>
        <textarea id="course-description" name="description" value={formData.description} onChange={handleChange} disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2" rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="course-branch" className="text-sm font-medium">Branch *</label>
          <select id="course-branch" name="branchId" value={formData.branchId} onChange={handleChange} disabled={isSubmitting} required className="w-full rounded-md border border-input bg-background px-3 py-2">
            <option value="">Select branch</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="course-level" className="text-sm font-medium">Level *</label>
          <select id="course-level" name="level" value={formData.level} onChange={handleChange} disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2">
            {courseLevels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="course-instructor" className="text-sm font-medium">Instructor</label>
        <select id="course-instructor" name="instructorId" value={formData.instructorId ?? ""} onChange={handleChange} disabled={isSubmitting} className="w-full rounded-md border border-input bg-background px-3 py-2">
          <option value="">Unassigned</option>
          {availableTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="course-duration" className="text-sm font-medium">Duration (hours)</label>
          <Input id="course-duration" name="durationHours" type="number" min="0" value={formData.durationHours} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="space-y-2">
          <label htmlFor="course-price" className="text-sm font-medium">Price (₹)</label>
          <Input id="course-price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting || branches.length === 0}>
        {isSubmitting ? "Saving..." : initialData ? "Update Course" : "Add Course"}
      </Button>
    </form>
  )
}
