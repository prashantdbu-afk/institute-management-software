"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Edit2, Package } from "lucide-react"

interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  minStock: number
  unitPrice: number
  branch: string
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: 0,
    minStock: 10,
    unitPrice: 0,
    branch: "Main Branch",
  })

  useEffect(() => {
    const saved = localStorage.getItem("stock_items")
    if (saved) setItems(JSON.parse(saved))
    else {
      const initialItems: StockItem[] = [
        {
          id: "1",
          name: "Books",
          category: "Stationery",
          quantity: 150,
          minStock: 50,
          unitPrice: 5,
          branch: "Main Branch",
        },
        {
          id: "2",
          name: "Pens",
          category: "Stationery",
          quantity: 300,
          minStock: 100,
          unitPrice: 0.5,
          branch: "Main Branch",
        },
        {
          id: "3",
          name: "Notebooks",
          category: "Stationery",
          quantity: 200,
          minStock: 75,
          unitPrice: 2,
          branch: "Branch 2",
        },
      ]
      setItems(initialItems)
      localStorage.setItem("stock_items", JSON.stringify(initialItems))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedItems = editingId
      ? items.map((item) => (item.id === editingId ? { ...item, ...formData } : item))
      : [...items, { ...formData, id: Date.now().toString() }]
    setItems(updatedItems)
    localStorage.setItem("stock_items", JSON.stringify(updatedItems))
    setFormData({ name: "", category: "", quantity: 0, minStock: 10, unitPrice: 0, branch: "Main Branch" })
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (item: StockItem) => {
    setFormData(item)
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    localStorage.setItem("stock_items", JSON.stringify(updated))
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const lowStockItems = items.filter((item) => item.quantity <= item.minStock)
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="text-primary" />
            Stock Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage inventory and stock levels</p>
        </div>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({ name: "", category: "", quantity: 0, minStock: 10, unitPrice: 0, branch: "Main Branch" })
          }}
        >
          <Plus size={20} />
          {showForm ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold text-primary">{items.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Stock Value</p>
          <p className="text-2xl font-bold text-primary">${totalValue.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
          <p className="text-2xl font-bold text-destructive">{lowStockItems.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Unit Price</p>
          <p className="text-2xl font-bold text-primary">${(totalValue / items.length || 0).toFixed(2)}</p>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Stock Item" : "Add New Stock Item"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Item Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Stationery, Equipment"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Quantity *</label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Minimum Stock Level</label>
              <Input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number.parseInt(e.target.value) })}
                placeholder="10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Unit Price ($)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number.parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Branch</label>
              <Input
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="Branch name"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">
                {editingId ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by item name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Items List */}
      <div className="grid gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`p-4 ${item.quantity <= item.minStock ? "border-destructive bg-destructive/5" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{item.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className={`font-medium ${item.quantity <= item.minStock ? "text-destructive" : ""}`}>
                        {item.quantity} {item.quantity <= item.minStock && "(Low)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Min. Stock</p>
                      <p className="font-medium">{item.minStock}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit Price</p>
                      <p className="font-medium">${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Value</p>
                      <p className="font-medium">${(item.quantity * item.unitPrice).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{item.branch}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No stock items found</p>
          </Card>
        )}
      </div>
    </div>
  )
}
