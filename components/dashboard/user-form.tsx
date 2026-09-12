"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "branch_manager" | "teacher" | "student"
  branch: string
  status: "active" | "inactive"
  createdAt: string
}

interface UserFormProps {
  initialData?: User | null
  onSubmit: (data: Omit<User, "id" | "createdAt">) => void
}

export function UserForm({ initialData, onSubmit }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student" as const,
    branch: "Main Campus",
    status: "active" as const,
  })

  const [branches, setBranches] = useState<string[]>(["Main Campus", "West Branch", "East Branch"])

  useEffect(() => {
    // Load branches from localStorage
    const saved = localStorage.getItem("branches")
    if (saved) {
      const branchList = JSON.parse(saved)
      setBranches(branchList.map((b: any) => b.name))
    }
  }, [])

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, ...rest } = initialData
      setFormData(rest)
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
        <label className="text-sm font-medium">Role *</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
        >
          <option value="admin">Admin</option>
          <option value="branch_manager">Branch Manager</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Branch *</label>
        <select
          name="branch"
          value={formData.branch}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-input bg-background"
        >
          {formData.role === "admin" ? (
            <option value="All">All Branches</option>
          ) : (
            <>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status *</label>
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

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update User" : "Add User"}
        </Button>
      </div>
    </form>
  )
}
