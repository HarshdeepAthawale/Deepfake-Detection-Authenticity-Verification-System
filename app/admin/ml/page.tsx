"use client"

import { useState, useEffect } from "react"
import { TacticalShell } from "@/components/tactical-shell"
import { AdminProtectedRoute } from "@/components/admin-protected-route"
import { apiService } from "@/lib/api"
import { Brain, Activity, Server, Settings, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MLHealth {
  enabled: boolean
  healthy: boolean
  serviceUrl: string
  modelVersion: string
  confidenceThreshold: number
  lastChecked: string
}

interface MLConfig {
  serviceUrl: string
  enabled: boolean
  timeout: number
  retries: number
  modelVersion: string
  confidenceThreshold: number
}

export default function MLConfigPage() {
  const [health, setHealth] = useState<MLHealth | null>(null)
  const [config, setConfig] = useState<MLConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadMLData()
  }, [])

  const loadMLData = async () => {
    try {
      setLoading(true)
      const [healthResponse, configResponse] = await Promise.all([
        apiService.getMLHealth(),
        apiService.getMLConfig(),
      ])

      if (healthResponse.success) {
        setHealth(healthResponse.data)
      }
      if (configResponse.success) {
        setConfig(configResponse.data)
      }
    } catch (error) {
      console.error("Failed to load ML data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMLData()
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <AdminProtectedRoute>
      <TacticalShell activeTab="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground mb-4">
            <span className="text-primary">SENTINEL_X</span>
            <span>/</span>
            <span>ADMIN_PANEL</span>
            <span>/</span>
            <span>ML_SERVICE_CONFIG</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-xs font-mono">
              Loading ML service configuration...
            </div>
          ) : (
            <>
              {/* ML Service Health Status */}
              <div className="bg-card/30 border border-primary/10 rounded-sm p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-primary border-b border-primary/10 pb-2 uppercase tracking-tighter">
                    ML_SERVICE_STATUS
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="border-primary/20 bg-transparent text-primary text-[10px] font-bold h-8"
                  >
                    REFRESH
                  </Button>
                </div>

                {health ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        health.healthy ? "bg-success border-success" : "bg-destructive border-destructive"
                      )} />
                      <div className="flex-1">
                        <div className="text-xs font-mono text-foreground font-bold uppercase">
                          {health.healthy ? "SERVICE_OPERATIONAL" : "SERVICE_UNAVAILABLE"}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-1">
                          Last checked: {new Date(health.lastChecked).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/10">
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">SERVICE_URL</div>
                        <div className="text-xs font-mono text-foreground">{health.serviceUrl}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">MODEL_VERSION</div>
                        <div className="text-xs font-mono text-foreground">{health.modelVersion}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">ENABLED</div>
                        <div className={cn(
                          "text-xs font-mono font-bold",
                          health.enabled ? "text-success" : "text-destructive"
                        )}>
                          {health.enabled ? "YES" : "NO"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">CONFIDENCE_THRESHOLD</div>
                        <div className="text-xs font-mono text-foreground">{health.confidenceThreshold}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-muted-foreground">
                    Unable to fetch ML service status
                  </div>
                )}
              </div>

              {/* ML Service Configuration */}
              {config && (
                <div className="bg-card/30 border border-primary/10 rounded-sm p-6 backdrop-blur-sm">
                  <h2 className="text-sm font-bold text-primary mb-4 border-b border-primary/10 pb-2 uppercase tracking-tighter">
                    ML_SERVICE_CONFIGURATION
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">SERVICE_URL</div>
                        <div className="text-xs font-mono text-foreground bg-background/50 border border-primary/20 rounded px-3 py-2">
                          {config.serviceUrl}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">MODEL_VERSION</div>
                        <div className="text-xs font-mono text-foreground bg-background/50 border border-primary/20 rounded px-3 py-2">
                          {config.modelVersion}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">TIMEOUT_MS</div>
                        <div className="text-xs font-mono text-foreground bg-background/50 border border-primary/20 rounded px-3 py-2">
                          {config.timeout}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">MAX_RETRIES</div>
                        <div className="text-xs font-mono text-foreground bg-background/50 border border-primary/20 rounded px-3 py-2">
                          {config.retries}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">CONFIDENCE_THRESHOLD</div>
                        <div className="text-xs font-mono text-foreground bg-background/50 border border-primary/20 rounded px-3 py-2">
                          {config.confidenceThreshold} ({(config.confidenceThreshold * 100).toFixed(0)}%)
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-primary/10">
                      <div className="bg-primary/5 border border-primary/20 rounded-sm p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={16} className="text-primary mt-0.5" />
                          <div className="flex-1">
                            <div className="text-[10px] font-mono text-primary font-bold uppercase mb-1">
                              CONFIGURATION_NOTE
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground leading-relaxed">
                              ML service configuration is managed via environment variables. To update these settings, modify the backend .env file and restart the server.
                              <br />
                              <br />
                              Required environment variables:
                              <br />
                              • ML_SERVICE_URL - ML service endpoint (default: http://localhost:5000)
                              <br />
                              • ML_SERVICE_ENABLED - Enable/disable ML service (default: true)
                              <br />
                              • ML_MODEL_VERSION - Model version identifier (default: v1)
                              <br />
                              • ML_CONFIDENCE_THRESHOLD - Confidence threshold (default: 0.5)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ML Service Integration Guide */}
              <div className="bg-card/30 border border-primary/10 rounded-sm p-6 backdrop-blur-sm">
                <h2 className="text-sm font-bold text-primary mb-4 border-b border-primary/10 pb-2 uppercase tracking-tighter">
                  ML_SERVICE_INTEGRATION
                </h2>

                <div className="space-y-3 text-[10px] font-mono text-muted-foreground leading-relaxed">
                  <p>
                    The ML service should be a Python Flask/FastAPI service that provides deepfake detection inference.
                  </p>
                  <p className="font-bold text-primary uppercase mt-4 mb-2">Required Endpoints:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><code className="text-primary">GET /health</code> - Health check endpoint</li>
                    <li><code className="text-primary">POST /api/v1/inference</code> - Deepfake detection inference</li>
                  </ul>
                  <p className="font-bold text-primary uppercase mt-4 mb-2">Inference Request Format:</p>
                  <pre className="bg-background/50 border border-primary/20 rounded p-3 text-[9px] overflow-x-auto">
{`{
  "hash": "sha256:...",
  "mediaType": "VIDEO|AUDIO|IMAGE",
  "metadata": {...},
  "extractedFrames": [...],
  "extractedAudio": "...",
  "modelVersion": "v1"
}`}
                  </pre>
                  <p className="font-bold text-primary uppercase mt-4 mb-2">Inference Response Format:</p>
                  <pre className="bg-background/50 border border-primary/20 rounded p-3 text-[9px] overflow-x-auto">
{`{
  "video_score": 0-100,
  "audio_score": 0-100,
  "gan_fingerprint": 0-100,
  "temporal_consistency": 0-100,
  "risk_score": 0-100,
  "confidence": 0-100,
  "model_version": "v1",
  "inference_time": 1234
}`}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </TacticalShell>
    </AdminProtectedRoute>
  )
}
