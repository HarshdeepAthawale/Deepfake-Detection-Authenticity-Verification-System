"use client"

import { useState, useEffect } from "react"
import { apiService } from "@/lib/api"
import { Edit, Trash2, Plus, Search, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  operativeId: string
  role: string
  isActive: boolean
  metadata?: {
    firstName?: string
    lastName?: string
    department?: string
  }
  createdAt?: string
}

interface UserListProps {
  onEdit: (user: User) => void
  onDelete: (userId: string) => void
  onCreate: () => void
}

export function UserList({ onEdit, onDelete, onCreate }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    role: "",
    isActive: "",
    search: "",
  })

  useEffect(() => {
    loadUsers()
  }, [page, filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await apiService.getAllUsers(page, 20, {
        ...(filters.role && { role: filters.role }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.search && { search: filters.search }),
      })
      if (response.success) {
        setUsers(response.data || [])
        setTotalPages(response.pagination?.pages || 1)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await apiService.deleteUser(userId)
        loadUsers()
      } catch (error: any) {
        alert(error.message || "Failed to delete user")
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-primary">USER_MANAGEMENT</h2>
        <div className="flex gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="text-primary/60 hover:text-primary transition-colors"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-bold px-3 py-1.5 transition-all uppercase tracking-widest"
          >
            <Plus size={12} />
            Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-card/30 border border-primary/10 rounded-sm px-8 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
          />
        </div>
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="operative">Operative</option>
          <option value="analyst">Analyst</option>
        </select>
        <select
          value={filters.isActive}
          onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
          className="bg-card/30 border border-primary/10 rounded-sm px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-primary/40"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <div className="flex items-center text-[10px] text-muted-foreground">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-card/30 border border-primary/10 rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-xs font-mono">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs font-mono">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead className="bg-primary/5 border-b border-primary/10">
                <tr>
                  <th className="text-left p-3 text-primary font-bold uppercase">Email</th>
                  <th className="text-left p-3 text-primary font-bold uppercase">Operative ID</th>
                  <th className="text-left p-3 text-primary font-bold uppercase">Role</th>
                  <th className="text-left p-3 text-primary font-bold uppercase">Status</th>
                  <th className="text-left p-3 text-primary font-bold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-primary/5 hover:bg-primary/5 transition-colors"
                  >
                    <td className="p-3">{user.email}</td>
                    <td className="p-3 text-primary font-bold">{user.operativeId}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 border rounded-sm text-[9px] font-black uppercase",
                          user.role === "admin"
                            ? "text-destructive bg-destructive/10 border-destructive/20"
                            : "text-primary bg-primary/10 border-primary/20"
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 border rounded-sm text-[9px] font-black uppercase",
                          user.isActive
                            ? "text-success bg-success/10 border-success/20"
                            : "text-muted-foreground bg-muted/10 border-muted/20"
                        )}
                      >
                        {user.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="text-primary/60 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-destructive/60 hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-primary/10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="text-primary/60 hover:text-primary disabled:opacity-30 transition-colors text-[10px] font-mono"
            >
              Previous
            </button>
            <span className="text-[10px] text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="text-primary/60 hover:text-primary disabled:opacity-30 transition-colors text-[10px] font-mono"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

