"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Fee {
  id: string
  studentName: string
  studentEmail: string
  course: string
  amount: number
  dueDate: string
  paidDate?: string
  status: "pending" | "paid" | "overdue"
  paymentMethod?: string
}

interface FeeFormProps {
  initialData?: Fee | null
  onSubmit: (data: Omit<Fee, "id">) => void
}

export function FeeForm({ initialData, onSubmit }: FeeFormProps) {
  const [formData, setFormData] = useState<Omit<Fee, "id">>({
    studentName: "",
    studentEmail: "",
    course: "",
    amount: 0,
    dueDate: "",
    paidDate: "",
    status: "pending" as const,
    paymentMethod: "",
  })

  const [courses, setCourses] = useState<string[]>([])
  const [students, setStudents] = useState<Array<{ name: string; email: string }>>([])

  useEffect(() => {
    // Load courses from localStorage
    const savedCourses = localStorage.getItem("courses")
    if (savedCourses) {
      const courseList = JSON.parse(savedCourses)
      setCourses(courseList.map((c: any) => c.name))
    }

    // Load students from admissions
    const savedAdmissions = localStorage.getItem("admissions")
    if (savedAdmissions) {
      const admissions = JSON.parse(savedAdmissions)
      const studentList = admissions
        .filter((a: any) => a.status === "approved")
        .map((a: any) => ({
          name: a.studentName,
          email: a.email,
        }))
      setStudents(studentList)
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, paidDate: initialData.paidDate ?? "", paymentMethod: initialData.paymentMethod ?? "" })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleStudentChange = (studentName: string) => {
    const student = students.find((s) => s.name === studentName)
    setFormData((prev) => ({
      ...prev,
      studentName,
      studentEmail: student?.email || "",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.studentName.trim() || !formData.course.trim() || !formData.dueDate.trim()) {
      alert("Please fill in all required fields")
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Student Name *</label>
        <select
          value={formData.studentName}
          onChange={(e) => handleStudentChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
          required
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.email} value={student.name}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input value={formData.studentEmail} readOnly disabled className="bg-muted" />
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
        <label className="text-sm font-medium">Amount (₹) *</label>
        <Input
          name="amount"
          type="number"
          min="0"
          placeholder="5000"
          value={formData.amount}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Due Date *</label>
        <Input name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} required />
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
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {formData.status === "paid" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Date</label>
            <Input name="paidDate" type="date" value={formData.paidDate} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <Input
              name="paymentMethod"
              placeholder="Online Transfer, Cheque, Cash"
              value={formData.paymentMethod}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update Fee Record" : "Add Fee Record"}
        </Button>
      </div>
    </form>
  )
}
