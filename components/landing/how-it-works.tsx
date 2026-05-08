"use client"

import { useEffect, useRef, useState } from "react"
import { Upload, Cpu, ShieldCheck } from "lucide-react"

const STEPS = [
  {
    step: "01",
    icon: Upload,
    title: "UPLOAD MEDIA",
    desc: "Submit video, image, or audio through the encrypted upload interface. Files are hashed on arrival and stored in the evidence vault.",
    detail: "Supports MP4, AVI, MOV, WEBM, MP3, WAV, JPG, PNG",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI AGENTS ANALYZE",
    desc: "Perception Agent extracts visual and audio signals. Cognitive Agent runs them through SiglIP and wav2vec2 models in parallel. Results are synthesized into a single verdict.",
    detail: "~13s video · ~300ms image · ~2s audio",
  },
  {
    step: "03",
    icon: ShieldCheck,
    title: "GET VERDICT",
    desc: "Receive a classified verdict — AUTHENTIC, DEEPFAKE, or SUSPICIOUS — with confidence score, risk score, facial detection rate, and per-agent explanations.",
    detail: "Full report exportable as PDF, JSON, or CSV",
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.2 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 px-6 relative border-t border-[oklch(0.62_0.12_40)]/10">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#4af_1px,transparent_1px),linear-gradient(to_bottom,#4af_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 border border-[oklch(0.62_0.12_40)]/20 bg-[oklch(0.62_0.12_40)]/5 px-4 py-1.5 rounded-sm text-[10px] font-mono text-[oklch(0.62_0.12_40)] uppercase tracking-widest">
            OPERATIONAL PROTOCOL
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tighter">
            HOW IT WORKS
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div
            className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 transition-all duration-1000"
            style={{ opacity: visible ? 1 : 0 }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {STEPS.map(({ step, icon: Icon, title, desc, detail }, i) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center space-y-4"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(32px)",
                  transition: `opacity 0.6s ease ${i * 150}ms, transform 0.6s ease ${i * 150}ms`,
                }}
              >
                {/* Step number + icon */}
                <div className="relative">
                  <div className="w-24 h-24 border-2 border-[oklch(0.62_0.12_40)]/30 bg-[oklch(0.62_0.12_40)]/5 flex items-center justify-center rounded-sm relative">
                    <div className="absolute inset-0 bg-[oklch(0.62_0.12_40)]/5 animate-pulse rounded-sm" />
                    <Icon size={36} className="text-[oklch(0.62_0.12_40)] relative z-10" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-[oklch(0.62_0.12_40)] text-[oklch(0.62_0.12_40)]-foreground text-[10px] font-black font-mono flex items-center justify-center rounded-sm">
                    {step}
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono">{desc}</p>
                  <div className="inline-block border border-[oklch(0.62_0.12_40)]/20 bg-[oklch(0.62_0.12_40)]/5 px-3 py-1 rounded-sm">
                    <span className="text-[9px] font-mono text-[oklch(0.62_0.12_40)]/70 tracking-wider">{detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
