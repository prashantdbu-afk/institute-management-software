"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Course {
  id: string
  name: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  maxStudents: number
  enrolledStudents: number
  instructor: string
  price: number
  createdAt: string
}

interface CourseFormProps {
  initialData?: Course | null
  onSubmit: (data: Omit<Course, "id" | "createdAt">) => void
}

export function CourseForm({ initialData, onSubmit }: CourseFormProps) {
  const [formData, setFormData] = useState<Omit<Course, "id" | "createdAt">>({
    name: "",
    description: "",
    level: "Beginner" as const,
    duration: "",
    maxStudents: 30,
    enrolledStudents: 0,
    instructor: "",
    price: 0,
  })

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, ...rest } = initialData
      setFormData(rest)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ["maxStudents", "enrolledStudents", "price"].includes(name) ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.instructor.trim()) {
      alert("Please fill in all required fields")
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Course Name *</label>
        <Input name="name" placeholder="Web Development" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          placeholder="Course description..."
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Level</label>
        <select
          name="level"
          value={formData.level}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Duration</label>
        <Input name="duration" placeholder="3 months" value={formData.duration} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Instructor *</label>
        <Input
          name="instructor"
          placeholder="Instructor name"
          value={formData.instructor}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Max Students</label>
          <Input name="maxStudents" type="number" min="1" value={formData.maxStudents} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Enrolled</label>
          <Input
            name="enrolledStudents"
            type="number"
            min="0"
            value={formData.enrolledStudents}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price (₹)</label>
          <Input name="price" type="number" min="0" value={formData.price} onChange={handleChange} />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update Course" : "Add Course"}
        </Button>
      </div>
    </form>
  )
}
