"use client"

import { useState, useEffect } from "react"
import { apiService } from "@/lib/api"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id?: string
  email: string
  operativeId: string
  role: string
  isActive: boolean
  password?: string
  metadata?: {
    firstName?: string
    lastName?: string
    department?: string
    clearanceLevel?: string
  }
}

interface UserFormProps {
  user?: User | null
  onClose: () => void
  onSuccess: () => void
}

export function UserForm({ user, onClose, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState<User>({
    email: "",
    operativeId: "",
    role: "operative",
    isActive: true,
    password: "",
    metadata: {
      firstName: "",
      lastName: "",
      department: "",
      clearanceLevel: "CONFIDENTIAL",
    },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        operativeId: user.operativeId || "",
        role: user.role || "operative",
        isActive: user.isActive !== undefined ? user.isActive : true,
        password: "",
        metadata: {
          firstName: user.metadata?.firstName || "",
          lastName: user.metadata?.lastName || "",
          department: user.metadata?.department || "",
          clearanceLevel: user.metadata?.clearanceLevel || "CONFIDENTIAL",
        },
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const submitData: any = {
        email: formData.email,
        operativeId: formData.operativeId,
        role: formData.role,
        isActive: formData.isActive,
        metadata: formData.metadata,
      }

      // Only include password if provided (for new users or when updating)
      if (formData.password) {
        submitData.password = formData.password
      }

      if (user?.id) {
        // Update existing user
        await apiService.updateUser(user.id, submitData)
      } else {
        // Create new user
        if (!formData.password) {
          setError("Password is required for new users")
          setLoading(false)
          return
        }
        await apiService.createUser(submitData)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-primary/20 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-primary/10 p-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-primary uppercase">
            {user ? "Edit User" : "Create User"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-mono p-3 rounded-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                Operative ID
              </label>
              <input
                type="text"
                value={formData.operativeId}
                onChange={(e) => setFormData({ ...formData, operativeId: e.target.value.toUpperCase() })}
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
                placeholder="Auto-generated if empty"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                Password {user ? "(leave empty to keep current)" : "*"}
              </label>
              <input
                type="password"
                required={!user}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
              >
                <option value="operative">Operative</option>
                <option value="analyst">Analyst</option>
                {!user && <option value="admin">Admin</option>}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.metadata?.firstName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, firstName: e.target.value },
                  })
                }
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.metadata?.lastName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, lastName: e.target.value },
                  })
                }
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.metadata?.department || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, department: e.target.value },
                  })
                }
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
              />
            </div>

            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">
                Clearance Level
              </label>
              <select
                value={formData.metadata?.clearanceLevel || "CONFIDENTIAL"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, clearanceLevel: e.target.value },
                  })
                }
                className="w-full bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
              >
                <option value="PUBLIC">Public</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="SECRET">Secret</option>
                <option value="TOP_SECRET">Top Secret</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-[10px] text-muted-foreground uppercase">
              Active Account
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-primary/10">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-bold py-2 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Saving..." : user ? "Update User" : "Create User"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-card/30 hover:bg-card/50 border border-primary/10 text-foreground text-[10px] font-bold py-2 transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

