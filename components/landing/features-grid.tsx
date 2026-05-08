"use client"

import { useEffect, useRef, useState } from "react"
import { Video, Volume2, Brain, Archive, Users, FileText } from "lucide-react"

const FEATURES = [
  {
    icon: Video,
    title: "VIDEO DEEPFAKE DETECTION",
    desc: "Frame-by-frame analysis using SiglIP vision transformer. Detects GAN artifacts, facial inconsistencies, and temporal anomalies across all major video formats.",
    badge: "94.44% ACCURACY",
    badgeColor: "text-green-400 border-green-400/30 bg-green-400/5",
  },
  {
    icon: Volume2,
    title: "AUDIO ANALYSIS",
    desc: "wav2vec2-large-xlsr model identifies voice cloning, TTS artifacts, and synthetic audio patterns. Works on standalone audio and video soundtracks.",
    badge: "92.86% ACCURACY",
    badgeColor: "text-blue-400 border-blue-400/30 bg-blue-400/5",
  },
  {
    icon: Brain,
    title: "MULTI-AGENT AI",
    desc: "Three specialized agents — Perception, Cognitive, and Learning — collaborate in real time. Each handles a distinct phase of analysis and feeds into a consensus verdict.",
    badge: "3 AGENTS",
    badgeColor: "text-purple-400 border-purple-400/30 bg-purple-400/5",
  },
  {
    icon: Archive,
    title: "EVIDENCE VAULT",
    desc: "Cryptographic hash locking for every scan. Immutable evidence chain with full chain-of-custody tracking. GPS metadata extraction and case assignment.",
    badge: "HASH-LOCKED",
    badgeColor: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  },
  {
    icon: Users,
    title: "ROLE-BASED ACCESS",
    desc: "Three-tier clearance model: Admin, Analyst, and Operative. Each role has granular permissions mapped to specific capabilities — no privilege escalation possible.",
    badge: "3 ROLES",
    badgeColor: "text-orange-400 border-orange-400/30 bg-orange-400/5",
  },
  {
    icon: FileText,
    title: "FULL AUDIT TRAIL",
    desc: "Every action is logged — logins, scans, verdicts, feedback, and config changes. Exportable CSV audit logs with filtering by operative, action type, and status.",
    badge: "TAMPER-PROOF",
    badgeColor: "text-red-400 border-red-400/30 bg-red-400/5",
  },
]

export function FeaturesGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" ref={ref} className="py-24 px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(100,160,255,0.04),transparent)] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 border border-[oklch(0.62_0.12_40)]/20 bg-[oklch(0.62_0.12_40)]/5 px-4 py-1.5 rounded-sm text-[10px] font-mono text-[oklch(0.62_0.12_40)] uppercase tracking-widest">
            CORE CAPABILITIES
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tighter">
            BUILT FOR THE FIELD
          </h2>
          <p className="text-muted-foreground font-mono text-sm max-w-xl mx-auto">
            Every module engineered for intelligence-grade media verification.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, badge, badgeColor }, i) => (
            <div
              key={title}
              className="relative border border-[oklch(0.62_0.12_40)]/15 bg-card/40 hover:bg-card/70 hover:border-[oklch(0.62_0.12_40)]/30 transition-all duration-300 p-6 rounded-sm group"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
              }}
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[oklch(0.62_0.12_40)]/30 group-hover:border-[oklch(0.62_0.12_40)]/60 transition-colors" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[oklch(0.62_0.12_40)]/30 group-hover:border-[oklch(0.62_0.12_40)]/60 transition-colors" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[oklch(0.62_0.12_40)]/30 group-hover:border-[oklch(0.62_0.12_40)]/60 transition-colors" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[oklch(0.62_0.12_40)]/30 group-hover:border-[oklch(0.62_0.12_40)]/60 transition-colors" />

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-[oklch(0.62_0.12_40)]/10 border border-[oklch(0.62_0.12_40)]/20 flex items-center justify-center rounded-sm group-hover:bg-[oklch(0.62_0.12_40)]/20 transition-colors">
                    <Icon size={20} className="text-[oklch(0.62_0.12_40)]" />
                  </div>
                  <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded-sm uppercase tracking-wider ${badgeColor}`}>
                    {badge}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
