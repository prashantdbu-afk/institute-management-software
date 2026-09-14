"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { branchFormSchema, type BranchFormData, type BranchViewModel } from "@/lib/branches/model"

interface BranchFormProps {
  initialData?: BranchViewModel | null
  onSubmit: (data: BranchFormData) => Promise<void> | void
  isSubmitting?: boolean
  error?: string
}

export function BranchForm({ initialData, onSubmit, isSubmitting = false, error = "" }: BranchFormProps) {
  const [formData, setFormData] = useState<BranchFormData>({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
  })
  const [validationError, setValidationError] = useState("")

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setValidationError("")
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = branchFormSchema.safeParse(formData)
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Please check the branch details.")
      return
    }
    await onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(validationError || error) && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {validationError || error}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="branch-name" className="text-sm font-medium">Branch Name *</label>
        <Input id="branch-name" name="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <label htmlFor="branch-address" className="text-sm font-medium">Address *</label>
        <Input id="branch-address" name="address" value={formData.address} onChange={handleChange} required disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <label htmlFor="branch-city" className="text-sm font-medium">City *</label>
        <Input id="branch-city" name="city" value={formData.city} onChange={handleChange} required disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <label htmlFor="branch-phone" className="text-sm font-medium">Phone Number</label>
        <Input id="branch-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isSubmitting} />
      </div>

      <div className="space-y-2">
        <label htmlFor="branch-email" className="text-sm font-medium">Email *</label>
        <Input id="branch-email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData ? "Update Branch" : "Add Branch"}
      </Button>
    </form>
  )
}
