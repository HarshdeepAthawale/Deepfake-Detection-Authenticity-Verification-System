"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { apiService, type ScanResult } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { MessageSquare, RefreshCcw, CheckCircle } from "lucide-react"

interface ScanDetailSheetProps {
  scanId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFeedbackSubmitted?: () => void
}

export function ScanDetailSheet({
  scanId,
  open,
  onOpenChange,
  onFeedbackSubmitted,
}: ScanDetailSheetProps) {
  const { user } = useAuth()
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [correctVerdictOpen, setCorrectVerdictOpen] = useState(false)
  const [correctedVerdict, setCorrectedVerdict] = useState<"AUTHENTIC" | "DEEPFAKE" | "SUSPICIOUS">("AUTHENTIC")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const canSubmitFeedback = user?.role === "admin" || user?.role === "analyst"
  const isCompleted = scan?.status === "COMPLETED"
  const hasFeedback = !!scan?.feedback?.correctedVerdict
  const canCorrectVerdict = canSubmitFeedback && isCompleted && !hasFeedback

  useEffect(() => {
    if (open && scanId) {
      setError(null)
      setScan(null)
      loadScan()
    }
  }, [open, scanId])

  const loadScan = async () => {
    if (!scanId) return
    try {
      setLoading(true)
      const response = await apiService.getScanDetails(scanId)
      if (response.success && response.data) {
        setScan(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scan details")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!scanId) return
    if (correctedVerdict === (scan?.verdict || "")) {
      setSubmitError("Corrected verdict must differ from the original verdict")
      return
    }
    try {
      setSubmitting(true)
      setSubmitError(null)
      await apiService.submitScanFeedback(scanId, {
        correctedVerdict,
        notes: notes.trim() || undefined,
      })
      setCorrectVerdictOpen(false)
      setNotes("")
      await loadScan()
      onFeedbackSubmitted?.()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenCorrectVerdict = () => {
    setSubmitError(null)
    setCorrectedVerdict(
      scan?.verdict === "AUTHENTIC" ? "DEEPFAKE" : scan?.verdict === "DEEPFAKE" ? "AUTHENTIC" : "DEEPFAKE"
    )
    setNotes("")
    setCorrectVerdictOpen(true)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm uppercase tracking-widest">
              Scan Details
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCcw className="w-8 h-8 text-primary/40 animate-spin" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive text-sm font-mono">{error}</div>
          ) : scan ? (
            <div className="mt-6 space-y-6">
              {/* Verdict & Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                      Verdict
                    </p>
                    <div
                      className={cn(
                        "inline-flex px-3 py-1.5 rounded border text-xs font-bold",
                        scan.verdict === "AUTHENTIC"
                          ? "text-success border-success/30 bg-success/10"
                          : scan.verdict === "DEEPFAKE"
                            ? "text-destructive border-destructive/30 bg-destructive/10"
                            : "text-warning border-warning/30 bg-warning/10",
                      )}
                    >
                      {scan.verdict}
                    </div>
                  </div>
                  {hasFeedback && scan.feedback && (
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                        Corrected
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="font-mono">{scan.feedback.correctedVerdict}</span>
                        {scan.feedback.correctedByOperativeId && (
                          <span className="text-muted-foreground">
                            by {scan.feedback.correctedByOperativeId}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                      Confidence
                    </p>
                    <p className="text-lg font-bold font-mono">{scan.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                      Risk Score
                    </p>
                    <p className="text-lg font-bold font-mono">{scan.riskScore}%</p>
                  </div>
                </div>

                {scan.fileName && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">File</p>
                    <p className="text-xs font-mono break-all">{scan.fileName}</p>
                  </div>
                )}

                {scan.mediaType && (
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                      Media Type
                    </p>
                    <p className="text-xs font-mono">{scan.mediaType}</p>
                  </div>
                )}
              </div>

              {/* Explanations */}
              {scan.explanations && scan.explanations.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MessageSquare size={12} />
                    Explanations
                  </p>
                  <ul className="space-y-1">
                    {scan.explanations.map((exp, i) => (
                      <li
                        key={i}
                        className="text-xs font-mono text-muted-foreground border-l-2 border-primary/30 pl-3 py-1"
                      >
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Correct Verdict Button */}
              {canCorrectVerdict && (
                <div className="pt-4 border-t border-primary/10">
                  <Button
                    variant="outline"
                    className="w-full border-primary/30 text-primary font-mono text-xs uppercase tracking-wider"
                    onClick={handleOpenCorrectVerdict}
                  >
                    Correct Verdict (Self-Learning)
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Correct Verdict Dialog */}
      <Dialog open={correctVerdictOpen} onOpenChange={setCorrectVerdictOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              Correct Verdict (Self-Learning Feedback)
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Submit the correct verdict to improve the model through periodic retraining. Original
            verdict: <span className="font-bold text-foreground">{scan?.verdict}</span>
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] font-mono uppercase">Corrected Verdict</Label>
              <Select
                value={correctedVerdict}
                onValueChange={(v) => setCorrectedVerdict(v as "AUTHENTIC" | "DEEPFAKE" | "SUSPICIOUS")}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTHENTIC">AUTHENTIC</SelectItem>
                  <SelectItem value="SUSPICIOUS">SUSPICIOUS</SelectItem>
                  <SelectItem value="DEEPFAKE">DEEPFAKE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-mono uppercase">Notes (Optional)</Label>
              <Textarea
                className="mt-2 min-h-[80px]"
                placeholder="Add context for this correction..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {submitError && (
              <p className="text-sm text-destructive font-mono">{submitError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectVerdictOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={submitting || correctedVerdict === scan?.verdict}
            >
              {submitting ? (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
