"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AnalyticsProtectedRoute } from "@/components/analytics-protected-route"
import { TacticalShell } from "@/components/tactical-shell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Download } from "lucide-react"

interface AuditLog {
  id: string
  operativeId: string
  action: string
  resource: string
  timestamp: string
  status: "success" | "failure" | "error"
}

export default function AuditPage() {
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append("search", searchTerm)
        if (filterAction !== "all") params.append("action", filterAction)
        if (filterStatus !== "all") params.append("status", filterStatus)

        const response = await fetch(`/api/admin/audit?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAuditLogs(data.data || [])
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchAuditLogs, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, filterAction, filterStatus])

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/audit/export", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "audit-logs.csv"
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Failed to export audit logs:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-500"
      case "failure":
        return "text-yellow-500"
      case "error":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    return status === "error" ? <AlertTriangle size={14} /> : null
  }

  return (
    <AnalyticsProtectedRoute>
      <TacticalShell activeTab="audit">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">AUDIT LOG</h1>
              <p className="text-sm text-muted-foreground">System activity and investigation history</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-primary uppercase block mb-2">Search</label>
                <Input
                  placeholder="Search operative ID, action, resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
                />
              </div>

              <div className="w-full md:w-40">
                <label className="text-xs font-bold text-primary uppercase block mb-2">Action</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="bg-background/50 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="scan">Scan</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="case">Case</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-40">
                <label className="text-xs font-bold text-primary uppercase block mb-2">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-background/50 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {user?.role === "admin" && (
                <Button
                  onClick={handleExport}
                  className="bg-primary/20 hover:bg-primary/30 text-primary"
                  size="sm"
                >
                  <Download size={14} className="mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* Audit Log Table */}
          <Card className="border-primary/20 bg-card/50">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="text-sm">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/10 text-xs uppercase text-muted-foreground">
                        <th className="text-left py-3 px-4 font-mono">Operative ID</th>
                        <th className="text-left py-3 px-4 font-mono">Action</th>
                        <th className="text-left py-3 px-4 font-mono">Resource</th>
                        <th className="text-left py-3 px-4 font-mono">Status</th>
                        <th className="text-left py-3 px-4 font-mono">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                          <td className="py-3 px-4 font-mono text-primary">{log.operativeId}</td>
                          <td className="py-3 px-4 font-mono">{log.action}</td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">{log.resource}</td>
                          <td className={`py-3 px-4 font-mono flex items-center gap-2 ${getStatusColor(log.status)}`}>
                            {getStatusIcon(log.status)}
                            {log.status}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {user?.role !== "admin" && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>Read-only access. Export functionality available to administrators only.</span>
            </div>
          )}
        </div>
      </TacticalShell>
    </AnalyticsProtectedRoute>
  )
}
