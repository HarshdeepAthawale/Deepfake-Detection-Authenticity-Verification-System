"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { TacticalShell } from "@/components/tactical-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import ProfileInfoForm from "@/components/profile/profile-info-form"
import ChangePasswordForm from "@/components/profile/change-password-form"
import NotificationPrefsForm from "@/components/profile/notification-prefs-form"

export default function ProfilePage() {
  const { user } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleProfileUpdate = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const getClearanceLevelDisplay = (level?: string) => {
    if (!level) return "PUBLIC"
    return level.toUpperCase()
  }

  return (
    <ProtectedRoute>
      <TacticalShell activeTab="profile">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary">ACCOUNT SETTINGS</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>

          {/* Identity Card - Read Only */}
          {user && (
            <Card className="border-primary/20 bg-card/50 max-w-2xl">
              <CardHeader className="border-b border-primary/20">
                <CardTitle className="text-sm">IDENTITY</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-primary uppercase">Operative ID</label>
                    <p className="text-sm font-mono text-muted-foreground mt-1">{user.operativeId}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-primary uppercase">Role</label>
                    <p className="text-sm font-mono text-muted-foreground mt-1">{user.role.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-primary uppercase">Clearance Level</label>
                    <p className="text-sm font-mono text-yellow-500 mt-1">
                      {getClearanceLevelDisplay(user.metadata?.clearanceLevel)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-primary uppercase">Auth Method</label>
                    <p className="text-sm font-mono text-muted-foreground mt-1">
                      {(user.authProvider || "local").toUpperCase()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Personal Info Form */}
          <ProfileInfoForm onUpdate={handleProfileUpdate} />

          {/* Change Password Form */}
          {user?.authProvider !== "google" && <ChangePasswordForm />}

          {/* Google OAuth Message */}
          {user?.authProvider === "google" && (
            <Card className="border-blue-500/20 bg-blue-500/5 max-w-2xl">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    <p className="font-semibold">Password Management</p>
                    <p className="mt-1">Your password is managed by Google. Please use your Google account settings to change your password.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Preferences Form */}
          <NotificationPrefsForm />
        </div>
      </TacticalShell>
    </ProtectedRoute>
  )
}
