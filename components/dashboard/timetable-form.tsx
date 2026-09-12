"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TimeSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  course: string
  batch: string
  teacher: string
  room: string
}

interface TimetableFormProps {
  initialData?: TimeSlot | null
  onSubmit: (data: Omit<TimeSlot, "id">) => void
}

export function TimetableForm({ initialData, onSubmit }: TimetableFormProps) {
  const [formData, setFormData] = useState({
    day: "Monday",
    startTime: "08:00",
    endTime: "09:00",
    course: "",
    batch: "Batch A",
    teacher: "",
    room: "",
  })

  const [courses, setCourses] = useState<string[]>([])
  const [teachers, setTeachers] = useState<string[]>([])

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

  useEffect(() => {
    // Load courses and teachers from localStorage
    const savedCourses = localStorage.getItem("courses")
    if (savedCourses) {
      const courseList = JSON.parse(savedCourses)
      setCourses(courseList.map((c: any) => c.name))
    }

    const savedTeachers = localStorage.getItem("teachers")
    if (savedTeachers) {
      const teacherList = JSON.parse(savedTeachers)
      setTeachers(teacherList.map((t: any) => t.name))
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
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.course.trim() || !formData.teacher.trim()) {
      alert("Please fill in all required fields")
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Day *</label>
        <select
          name="day"
          value={formData.day}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
        >
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Time *</label>
          <select
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md border border-input bg-background"
          >
            {timeSlots.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">End Time *</label>
          <select
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md border border-input bg-background"
          >
            {timeSlots
              .filter((t) => t > formData.startTime)
              .map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
          </select>
        </div>
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
        <label className="text-sm font-medium">Teacher *</label>
        <select
          name="teacher"
          value={formData.teacher}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
          required
        >
          <option value="">Select a teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher} value={teacher}>
              {teacher}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Room/Location</label>
        <Input name="room" placeholder="Room 101" value={formData.room} onChange={handleChange} />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update Schedule" : "Add Schedule"}
        </Button>
      </div>
    </form>
  )
}
