"use client"

import { useState, useEffect } from "react"
import { AdminProtectedRoute } from "@/components/admin-protected-route"
import { TacticalShell } from "@/components/tactical-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Trash2 } from "lucide-react"

interface Session {
  userId: string
  email: string
  role: string
  loginTime: string
  lastActivity: string
  ipAddress: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/admin/sessions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSessions(data.data?.sessions || [])
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const handleTerminateSession = async (userId: string) => {
    if (!confirm(`Terminate session for user ${userId}?`)) return

    try {
      const response = await fetch(`/api/admin/sessions/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (response.ok) {
        setSessions(sessions.filter((s) => s.userId !== userId))
      }
    } catch (error) {
      console.error("Failed to terminate session:", error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-red-500"
      case "analyst":
        return "text-blue-500"
      case "operative":
        return "text-yellow-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <AdminProtectedRoute>
      <TacticalShell activeTab="admin">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary">ACTIVE SESSIONS</h1>
            <p className="text-sm text-muted-foreground">Manage and monitor user sessions</p>
          </div>

          {/* Sessions Table */}
          <Card className="border-primary/20 bg-card/50">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="text-sm">
                {loading ? "Loading..." : `${sessions.length} Active Session${sessions.length !== 1 ? "s" : ""}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active sessions</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10 text-xs uppercase text-muted-foreground">
                        <th className="text-left py-3 px-4 font-mono">Email</th>
                        <th className="text-left py-3 px-4 font-mono">Role</th>
                        <th className="text-left py-3 px-4 font-mono">Login Time</th>
                        <th className="text-left py-3 px-4 font-mono">Last Activity</th>
                        <th className="text-left py-3 px-4 font-mono">IP Address</th>
                        <th className="text-right py-3 px-4 font-mono">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.userId} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                          <td className="py-3 px-4 font-mono text-primary">{session.email}</td>
                          <td className={`py-3 px-4 font-mono ${getRoleColor(session.role)}`}>{session.role.toUpperCase()}</td>
                          <td className="py-3 px-4 font-mono text-muted-foreground text-xs">
                            {new Date(session.loginTime).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground text-xs">
                            {new Date(session.lastActivity).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">{session.ipAddress}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              onClick={() => handleTerminateSession(session.userId)}
                              className="bg-destructive/20 hover:bg-destructive/30 text-destructive h-8 px-3"
                              size="sm"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-mono flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>Terminating a session will force the user to re-authenticate on their next request.</span>
          </div>
        </div>
      </TacticalShell>
    </AdminProtectedRoute>
  )
}
