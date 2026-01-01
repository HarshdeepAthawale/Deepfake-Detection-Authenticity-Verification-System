"use client"

import { useState } from "react"
import { TacticalShell } from "@/components/tactical-shell"
import { AdminProtectedRoute } from "@/components/admin-protected-route"
import { UserList } from "@/components/admin/user-list"
import { UserForm } from "@/components/admin/user-form"
import { UserStats } from "@/components/admin/user-stats"

interface User {
  id?: string
  email: string
  operativeId: string
  role: string
  isActive: boolean
  metadata?: {
    firstName?: string
    lastName?: string
    department?: string
    clearanceLevel?: string
  }
}

export default function AdminUsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setShowForm(true)
  }

  const handleDelete = async (userId: string) => {
    // Delete is handled in UserList component
    setRefreshKey((prev) => prev + 1)
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <AdminProtectedRoute>
      <TacticalShell activeTab="admin">
        <div className="space-y-6">
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground mb-4">
            <span className="text-primary">SENTINEL_X</span>
            <span>/</span>
            <span>ADMIN_PANEL</span>
            <span>/</span>
            <span>USER_MANAGEMENT</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <UserList
                key={refreshKey}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreate={handleCreate}
              />
            </div>
            <div className="lg:col-span-1">
              <UserStats />
            </div>
          </div>

          {showForm && (
            <UserForm
              user={selectedUser}
              onClose={() => {
                setShowForm(false)
                setSelectedUser(null)
              }}
              onSuccess={handleFormSuccess}
            />
          )}
        </div>
      </TacticalShell>
    </AdminProtectedRoute>
  )
}

