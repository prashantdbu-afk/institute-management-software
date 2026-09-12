"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  qualification: string
  specialization: string
  assignedCourses: string[]
  experience: number
  status: "active" | "inactive"
  joiningDate: string
}

interface TeacherFormProps {
  initialData?: Teacher | null
  onSubmit: (data: Omit<Teacher, "id">) => void
}

export function TeacherForm({ initialData, onSubmit }: TeacherFormProps) {
  const [formData, setFormData] = useState<Omit<Teacher, "id">>({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
    assignedCourses: [] as string[],
    experience: 0,
    status: "active" as const,
    joiningDate: new Date().toISOString().split("T")[0],
  })

  const [courses, setCourses] = useState<string[]>([])

  useEffect(() => {
    // Load courses from localStorage
    const saved = localStorage.getItem("courses")
    if (saved) {
      const courseList = JSON.parse(saved)
      setCourses(courseList.map((c: any) => c.name))
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "experience" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleCoursesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value)
    setFormData((prev) => ({
      ...prev,
      assignedCourses: selected,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Please fill in all required fields")
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Full Name *</label>
        <Input name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email *</label>
        <Input
          name="email"
          type="email"
          placeholder="john@institute.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone</label>
        <Input name="phone" placeholder="+91-98765-43210" value={formData.phone} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Qualification</label>
          <Input
            name="qualification"
            placeholder="B.Tech, M.Sc"
            value={formData.qualification}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Experience (years)</label>
          <Input name="experience" type="number" min="0" value={formData.experience} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Specialization</label>
        <Input
          name="specialization"
          placeholder="Web Development"
          value={formData.specialization}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Assigned Courses</label>
        <select
          multiple
          value={formData.assignedCourses}
          onChange={handleCoursesChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
          size={3}
        >
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple courses</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md border border-input bg-background"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Joining Date</label>
          <Input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update Teacher" : "Add Teacher"}
        </Button>
      </div>
    </form>
  )
}
