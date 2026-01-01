"use client"

import { useState, useEffect } from "react"
import { apiService } from "@/lib/api"
import { Users, Shield, UserCheck, UserX } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserStats {
  total: number
  active: number
  inactive: number
  byRole: {
    admin: number
    operative: number
    analyst: number
  }
}

export function UserStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await apiService.getUserStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error("Failed to load user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-card/30 border border-primary/10 rounded-sm p-4 backdrop-blur-sm">
        <div className="p-8 text-center text-muted-foreground text-xs font-mono">
          Loading statistics...
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-card/30 border border-primary/10 rounded-sm p-4 backdrop-blur-sm">
        <div className="p-8 text-center text-muted-foreground text-xs font-mono">
          Failed to load statistics
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/30 border border-primary/10 rounded-sm p-4 backdrop-blur-sm">
      <h2 className="text-sm font-bold text-primary mb-4 border-b border-primary/10 pb-2">
        USER_STATISTICS
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatItem icon={<Users size={16} />} label="Total" value={stats.total} />
        <StatItem icon={<UserCheck size={16} />} label="Active" value={stats.active} status="safe" />
        <StatItem icon={<UserX size={16} />} label="Inactive" value={stats.inactive} status="warning" />
        <StatItem icon={<Shield size={16} />} label="Admin" value={stats.byRole.admin} />
      </div>
      <div className="pt-4 border-t border-primary/10">
        <div className="text-[10px] text-muted-foreground mb-2 uppercase">By Role</div>
        <div className="space-y-2">
          <RoleStat label="Operative" value={stats.byRole.operative} />
          <RoleStat label="Analyst" value={stats.byRole.analyst} />
        </div>
      </div>
    </div>
  )
}

function StatItem({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode
  label: string
  value: number
  status?: "safe" | "warning"
}) {
  const statusColors = {
    safe: "text-success",
    warning: "text-destructive",
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-primary/60">{icon}</div>
      <div className="flex-1">
        <div className="text-[9px] text-muted-foreground uppercase">{label}</div>
        <div className={cn("text-sm font-bold", status ? statusColors[status] : "text-foreground")}>
          {value}
        </div>
      </div>
    </div>
  )
}

function RoleStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-[11px] font-mono">
      <span className="text-muted-foreground uppercase">{label}</span>
      <span className="text-primary font-bold">{value}</span>
    </div>
  )
}

