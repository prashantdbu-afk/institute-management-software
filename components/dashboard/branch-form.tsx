"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email: string
  students: number
  teachers: number
  createdAt: string
}

interface BranchFormProps {
  initialData?: Branch | null
  onSubmit: (data: Omit<Branch, "id" | "createdAt">) => void
}

export function BranchForm({ initialData, onSubmit }: BranchFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    students: 0,
    teachers: 0,
  })

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, ...rest } = initialData
      setFormData(rest)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "students" || name === "teachers" ? Number.parseInt(value) || 0 : value,
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
        <label className="text-sm font-medium">Branch Name *</label>
        <Input name="name" placeholder="e.g., Main Campus" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Address *</label>
        <Input
          name="address"
          placeholder="e.g., 123 Education Street"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">City *</label>
        <Input name="city" placeholder="e.g., Mumbai" value={formData.city} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone Number *</label>
        <Input name="phone" placeholder="+91-22-1234-5678" value={formData.phone} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Email *</label>
        <Input
          name="email"
          type="email"
          placeholder="branch@institute.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Number of Students</label>
          <Input name="students" type="number" min="0" value={formData.students} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Number of Teachers</label>
          <Input name="teachers" type="number" min="0" value={formData.teachers} onChange={handleChange} />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Update Branch" : "Add Branch"}
        </Button>
      </div>
    </form>
  )
}
