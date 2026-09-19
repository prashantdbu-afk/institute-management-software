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
    addressLine1: initialData?.addressLine1 ?? "",
    addressLine2: initialData?.addressLine2 ?? "",
    city: initialData?.city ?? "",
    district: initialData?.district ?? "",
    state: initialData?.state ?? "",
    pinCode: initialData?.pinCode ?? "",
    country: "India",
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
        <label htmlFor="branch-address" className="text-sm font-medium">Address Line 1 *</label>
        <Input id="branch-address" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="space-y-2"><label htmlFor="branch-address-2" className="text-sm font-medium">Address Line 2</label><Input id="branch-address-2" name="addressLine2" value={formData.addressLine2} onChange={handleChange} disabled={isSubmitting}/></div>

      <div className="space-y-2">
        <label htmlFor="branch-city" className="text-sm font-medium">City *</label>
        <Input id="branch-city" name="city" value={formData.city} onChange={handleChange} required disabled={isSubmitting} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="branch-district" className="text-sm font-medium">District</label><Input id="branch-district" name="district" value={formData.district} onChange={handleChange} disabled={isSubmitting}/></div><div className="space-y-2"><label htmlFor="branch-state" className="text-sm font-medium">State *</label><Input id="branch-state" name="state" value={formData.state} onChange={handleChange} required disabled={isSubmitting}/></div></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="branch-pin" className="text-sm font-medium">PIN Code *</label><Input id="branch-pin" name="pinCode" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} value={formData.pinCode} onChange={handleChange} required disabled={isSubmitting}/></div><div className="space-y-2"><label htmlFor="branch-country" className="text-sm font-medium">Country</label><Input id="branch-country" name="country" value="India" readOnly/></div></div>

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
