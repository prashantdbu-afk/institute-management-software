"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Admission {
  id: string
  studentName: string
  parentName: string
  email: string
  phone: string
  course: string
  batch: string
  status: "pending" | "approved" | "rejected"
  appliedDate: string
  enrollmentDate?: string
}

interface AdmissionFormProps {
  initialData?: Admission | null
  onSubmit: (data: Omit<Admission, "id" | "appliedDate">) => void
}

export function AdmissionForm({ initialData, onSubmit }: AdmissionFormProps) {
  const [formData, setFormData] = useState<Omit<Admission, "id" | "appliedDate">>({
    studentName: "",
    parentName: "",
    email: "",
    phone: "",
    course: "",
    batch: "Batch A",
    status: "pending",
    enrollmentDate: "",
  })

  const [courses, setCourses] = useState<string[]>([])

  useEffect(() => {
    // Load courses from localStorage
    const saved = localStorage.getItem("courses")
    if (saved) {
      const courseList = JSON.parse(saved)
      setCourses(courseList.map((c: any) => c.name))
    } else {
      setCourses(["Web Development", "Python Basics", "UI/UX Design", "Data Science"])
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      const { id, appliedDate, ...rest } = initialData
      setFormData({ ...rest, enrollmentDate: rest.enrollmentDate ?? "" })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.studentName.trim() || !formData.email.trim() || !formData.course.trim()) {
      alert("Please fill in all required fields")
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Student Name *</label>
        <Input
          name="studentName"
          placeholder="Full name"
          value={formData.studentName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Parent/Guardian Name</label>
        <Input name="parentName" placeholder="Parent name" value={formData.parentName} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email *</label>
        <Input
          name="email"
          type="email"
          placeholder="student@email.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone</label>
        <Input name="phone" placeholder="+91-98765-43210" value={formData.phone} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Course *</label>
        <select
          name="course"
          value={formData.course}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
          required
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Batch</label>
        <select
          name="batch"
          value={formData.batch}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
        >
          <option value="Batch A">Batch A</option>
          <option value="Batch B">Batch B</option>
          <option value="Batch C">Batch C</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {formData.status === "approved" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Enrollment Date</label>
          <Input name="enrollmentDate" type="date" value={formData.enrollmentDate} onChange={handleChange} />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update Admission" : "Submit Application"}
        </Button>
      </div>
    </form>
  )
}
