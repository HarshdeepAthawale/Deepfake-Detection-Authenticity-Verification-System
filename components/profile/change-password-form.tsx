"use client"

import { useState } from "react"
import { apiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Save } from "lucide-react"
import { toast } from "sonner"

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) newErrors.currentPassword = "Current password is required"
    if (!newPassword) newErrors.newPassword = "New password is required"
    if (!confirmPassword) newErrors.confirmPassword = "Password confirmation is required"
    if (newPassword && newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters"
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      await apiService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
    } catch (error) {
      console.error("Failed to change password:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to change password"
      toast.error(errorMessage)

      if (errorMessage.includes("incorrect")) {
        setErrors({ currentPassword: "Current password is incorrect" })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-card/50 max-w-2xl">
      <CardHeader className="border-b border-primary/20">
        <CardTitle className="text-sm">CHANGE PASSWORD</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-primary uppercase block mb-2">Current Password</label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              setErrors({ ...errors, currentPassword: "" })
            }}
            placeholder="Enter current password"
            className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
          />
          {errors.currentPassword && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 dark:text-red-400">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{errors.currentPassword}</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-primary uppercase block mb-2">New Password</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setErrors({ ...errors, newPassword: "" })
            }}
            placeholder="Enter new password"
            className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
          />
          {errors.newPassword && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 dark:text-red-400">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{errors.newPassword}</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-primary uppercase block mb-2">Confirm Password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setErrors({ ...errors, confirmPassword: "" })
            }}
            placeholder="Confirm new password"
            className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
          />
          {errors.confirmPassword && (
            <div className="flex items-start gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600 dark:text-red-400">
              <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{errors.confirmPassword}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase h-10"
        >
          <Save size={16} className="mr-2" />
          {saving ? "Updating..." : "Change Password"}
        </Button>
      </CardContent>
    </Card>
  )
}
