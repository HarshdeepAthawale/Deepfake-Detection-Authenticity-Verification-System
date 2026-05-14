"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { apiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save } from "lucide-react"
import { toast } from "sonner"

interface NotificationPreference {
  emailEnabled: boolean
  emailOnDeepfake: boolean
  emailOnAll: boolean
  inAppEnabled: boolean
}

export default function NotificationPrefsForm() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPreference>({
    emailEnabled: false,
    emailOnDeepfake: false,
    emailOnAll: false,
    inAppEnabled: false,
  })
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs(user.notificationPreferences)
    }
  }, [user])

  const handleToggle = (key: keyof NotificationPreference) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!hasChanges) return

    setSaving(true)
    try {
      await apiService.updateNotificationPreferences(prefs)
      toast.success("Notification preferences updated")
      setHasChanges(false)
    } catch (error) {
      console.error("Failed to update preferences:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update preferences")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-card/50 max-w-2xl">
      <CardHeader className="border-b border-primary/20">
        <CardTitle className="text-sm">NOTIFICATION PREFERENCES</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-3">
          {/* Email Enabled Toggle */}
          <div className="flex items-center justify-between p-3 rounded border border-primary/10 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
            onClick={() => handleToggle("emailEnabled")}
          >
            <div>
              <label className="text-xs font-bold text-primary uppercase block">Email Alerts</label>
              <p className="text-xs text-muted-foreground mt-1">Receive email notifications for system events</p>
            </div>
            <div className="w-10 h-6 rounded-full bg-primary/20 relative flex items-center">
              <div
                className={`w-5 h-5 rounded-full bg-primary transition-transform ${
                  prefs.emailEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          {/* Email on Deepfake Toggle */}
          <div
            className="flex items-center justify-between p-3 rounded border border-primary/10 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
            onClick={() => handleToggle("emailOnDeepfake")}
          >
            <div>
              <label className="text-xs font-bold text-primary uppercase block">Email on Deepfake Detection</label>
              <p className="text-xs text-muted-foreground mt-1">Alert when deepfake is detected</p>
            </div>
            <div className="w-10 h-6 rounded-full bg-primary/20 relative flex items-center">
              <div
                className={`w-5 h-5 rounded-full bg-primary transition-transform ${
                  prefs.emailOnDeepfake ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          {/* Email on All Scans Toggle */}
          <div
            className="flex items-center justify-between p-3 rounded border border-primary/10 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
            onClick={() => handleToggle("emailOnAll")}
          >
            <div>
              <label className="text-xs font-bold text-primary uppercase block">Email on All Scans</label>
              <p className="text-xs text-muted-foreground mt-1">Alert for every scan completion</p>
            </div>
            <div className="w-10 h-6 rounded-full bg-primary/20 relative flex items-center">
              <div
                className={`w-5 h-5 rounded-full bg-primary transition-transform ${
                  prefs.emailOnAll ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          {/* In-App Notifications Toggle */}
          <div
            className="flex items-center justify-between p-3 rounded border border-primary/10 bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
            onClick={() => handleToggle("inAppEnabled")}
          >
            <div>
              <label className="text-xs font-bold text-primary uppercase block">In-App Notifications</label>
              <p className="text-xs text-muted-foreground mt-1">Display notifications within the application</p>
            </div>
            <div className="w-10 h-6 rounded-full bg-primary/20 relative flex items-center">
              <div
                className={`w-5 h-5 rounded-full bg-primary transition-transform ${
                  prefs.inAppEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase h-10"
        >
          <Save size={16} className="mr-2" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  )
}
