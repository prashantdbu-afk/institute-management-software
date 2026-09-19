"use client"

import { useMemo, useState } from "react"
import { Edit2, Mail, MapPin, Phone, Plus, Trash2 } from "lucide-react"
import { createBranchAction, deleteBranchAction, updateBranchAction } from "@/app/dashboard/branches/actions"
import { BranchForm } from "@/components/dashboard/branch-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  filterBranches,
  isBranchListEmpty,
  replaceBranch,
  type BranchFormData,
  type BranchViewModel,
} from "@/lib/branches/model"

export function BranchesClient({ initialBranches }: { initialBranches: BranchViewModel[] }) {
  const [branches, setBranches] = useState(initialBranches)
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchViewModel | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [mutationError, setMutationError] = useState("")
  const filteredBranches = useMemo(() => filterBranches(branches, searchTerm), [branches, searchTerm])
  const hasNoBranches = isBranchListEmpty(branches, searchTerm)

  const openCreateDialog = () => {
    setEditingBranch(null)
    setMutationError("")
    setOpenDialog(true)
  }

  const handleDialogChange = (open: boolean) => {
    if (isMutating) return
    setOpenDialog(open)
    if (!open) {
      setEditingBranch(null)
      setMutationError("")
    }
  }

  const handleAddBranch = async (formData: BranchFormData) => {
    setIsMutating(true)
    setMutationError("")
    try {
      const result = await createBranchAction(formData)
      if (!result.ok) return setMutationError(result.error)
      setBranches((current) => [result.branch, ...current])
      setOpenDialog(false)
    } catch {
      setMutationError("Unable to create the branch. Please try again.")
    } finally {
      setIsMutating(false)
    }
  }

  const handleUpdateBranch = async (formData: BranchFormData) => {
    if (!editingBranch) return
    setIsMutating(true)
    setMutationError("")
    try {
      const result = await updateBranchAction(editingBranch.id, formData)
      if (!result.ok) return setMutationError(result.error)
      setBranches((current) => replaceBranch(current, result.branch))
      setEditingBranch(null)
      setOpenDialog(false)
    } catch {
      setMutationError("Unable to update the branch. Please try again.")
    } finally {
      setIsMutating(false)
    }
  }

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return
    setIsMutating(true)
    setMutationError("")
    try {
      const result = await deleteBranchAction(id)
      if (!result.ok) return setMutationError(result.error)
      setBranches((current) => current.filter((branch) => branch.id !== id))
    } catch {
      setMutationError("Unable to delete the branch. Please try again.")
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="mt-2 text-muted-foreground">Manage all institute branches</p>
        </div>
        <Dialog open={openDialog} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2"><Plus size={20} />Add Branch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
              <DialogDescription>
                {editingBranch ? "Update branch details" : "Create a new branch for your institute"}
              </DialogDescription>
            </DialogHeader>
            <BranchForm
              key={editingBranch?.id ?? "new"}
              initialData={editingBranch}
              onSubmit={editingBranch ? handleUpdateBranch : handleAddBranch}
              isSubmitting={isMutating}
              error={mutationError}
            />
          </DialogContent>
        </Dialog>
      </div>

      {mutationError && !openDialog && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {mutationError}
        </div>
      )}

      <Card>
        <CardHeader>
          <Input placeholder="Search branches by name, city, or email..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </CardHeader>
        <CardContent>
          {filteredBranches.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">{hasNoBranches ? "No branches have been added yet" : "No branches found"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasNoBranches ? "Add the first branch to get started." : "Try a different search term."}
              </p>
              {hasNoBranches && <Button className="mt-4" onClick={openCreateDialog}><Plus size={18} />Add Branch</Button>}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBranches.map((branch) => (
                <div key={branch.id} className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold">{branch.name}</h3>
                      <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-3">
                        <div className="flex items-center gap-2"><MapPin size={16} /><span>{[branch.addressLine1,branch.addressLine2,branch.city,branch.district,branch.state,branch.pinCode,"India"].filter(Boolean).join(", ")}</span></div>
                        {branch.phone && <div className="flex items-center gap-2"><Phone size={16} /><span>{branch.phone}</span></div>}
                        <div className="flex items-center gap-2"><Mail size={16} /><span>{branch.email}</span></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" aria-label={`Edit ${branch.name}`} disabled={isMutating} onClick={() => { setEditingBranch(branch); setMutationError(""); setOpenDialog(true) }}><Edit2 size={16} /></Button>
                      <Button variant="destructive" size="sm" aria-label={`Delete ${branch.name}`} disabled={isMutating} onClick={() => handleDeleteBranch(branch.id)}><Trash2 size={16} /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
