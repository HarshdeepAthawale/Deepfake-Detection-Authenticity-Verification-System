"use client"

import { useState, useEffect } from "react"
import { AdminProtectedRoute } from "@/components/admin-protected-route"
import { TacticalShell } from "@/components/tactical-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Save } from "lucide-react"

interface Config {
  mlConfidenceThreshold: number
  rateLimitWindow: number
  rateLimitRequests: number
  selfLearningThreshold: number
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/admin/config", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setConfig(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch config:", error)
        setMessage({ type: "error", text: "Failed to load configuration" })
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Configuration updated successfully" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: "Failed to update configuration" })
      }
    } catch (error) {
      console.error("Failed to save config:", error)
      setMessage({ type: "error", text: "Error saving configuration" })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Config, value: string) => {
    if (!config) return

    const numValue = parseFloat(value)
    setConfig({
      ...config,
      [field]: isNaN(numValue) ? value : numValue,
    })
  }

  return (
    <AdminProtectedRoute>
      <TacticalShell activeTab="admin">
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary">SYSTEM CONFIG</h1>
            <p className="text-sm text-muted-foreground">Update runtime system configuration</p>
          </div>

          {/* Config Form */}
          <Card className="border-primary/20 bg-card/50 max-w-2xl">
            <CardHeader className="border-b border-primary/20">
              <CardTitle className="text-sm">ML & Rate Limiting Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading configuration...</div>
              ) : config ? (
                <>
                  {/* ML Confidence Threshold */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase">ML Confidence Threshold</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={config.mlConfidenceThreshold}
                        onChange={(e) => handleChange("mlConfidenceThreshold", e.target.value)}
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
                      />
                      <span className="text-xs text-muted-foreground">Min scan confidence to proceed (0-1)</span>
                    </div>
                  </div>

                  {/* Rate Limit Window */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase">Rate Limit Window (ms)</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        value={config.rateLimitWindow}
                        onChange={(e) => handleChange("rateLimitWindow", e.target.value)}
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
                      />
                      <span className="text-xs text-muted-foreground">Milliseconds for rate limit window</span>
                    </div>
                  </div>

                  {/* Rate Limit Requests */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase">Rate Limit Max Requests</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        value={config.rateLimitRequests}
                        onChange={(e) => handleChange("rateLimitRequests", e.target.value)}
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
                      />
                      <span className="text-xs text-muted-foreground">Max requests per window</span>
                    </div>
                  </div>

                  {/* Self-Learning Threshold */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase">Self-Learning Threshold</label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        value={config.selfLearningThreshold}
                        onChange={(e) => handleChange("selfLearningThreshold", e.target.value)}
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary/40"
                      />
                      <span className="text-xs text-muted-foreground">Feedback count to trigger retraining</span>
                    </div>
                  </div>

                  {/* Messages */}
                  {message && (
                    <div
                      className={`p-3 rounded text-xs font-mono flex items-start gap-2 ${
                        message.type === "success"
                          ? "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
                          : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
                      }`}
                    >
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{message.text}</span>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase h-10"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? "Saving..." : "Save Configuration"}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-destructive">Failed to load configuration</div>
              )}
            </CardContent>
          </Card>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-mono flex items-start gap-2 max-w-2xl">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>Configuration changes take effect immediately for new requests. Existing connections may use cached values.</span>
          </div>
        </div>
      </TacticalShell>
    </AdminProtectedRoute>
  )
}
