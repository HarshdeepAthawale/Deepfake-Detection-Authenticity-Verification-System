"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Shield, ArrowRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const TAGLINES = [
  "DETECTING SYNTHETIC MEDIA IN REAL TIME",
  "PROTECTING TRUTH WITH AGENTIC AI",
  "MISSION-CRITICAL AUTHENTICITY VERIFICATION",
]

export function HeroSection() {
  const [taglineIndex, setTaglineIndex] = useState(0)
  const [displayed, setDisplayed] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const target = TAGLINES[taglineIndex]
    let timeout: NodeJS.Timeout

    if (!isDeleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 40)
    } else if (!isDeleting && displayed.length === target.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2400)
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 20)
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false)
      setTaglineIndex((i) => (i + 1) % TAGLINES.length)
    }

    return () => clearTimeout(timeout)
  }, [displayed, isDeleting, taglineIndex])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#4af_1px,transparent_1px),linear-gradient(to_bottom,#4af_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(100,160,255,0.08),transparent)]" />

      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-primary/30" />
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-primary/30" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-primary/30" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-primary/30" />

      {/* Scanline */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-[scanline_6s_linear_infinite] pointer-events-none" />

      {/* Status bar top */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[10px] font-mono text-muted-foreground border border-[oklch(0.62_0.12_40)]/20 bg-card/30 px-4 py-1.5 rounded-sm backdrop-blur-sm whitespace-nowrap">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          SYSTEM OPERATIONAL
        </span>
        <span className="text-primary/30">|</span>
        <span>ML MODEL v4.1.0</span>
        <span className="text-primary/30">|</span>
        <span>AES-256 ENCRYPTED</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-12 max-w-4xl px-6 pt-20">
        {/* Animated badge */}
        <div className="inline-flex items-center gap-2 border border-[oklch(0.62_0.12_40)]/30 bg-[oklch(0.62_0.12_40)]/5 px-4 py-1.5 rounded-sm text-[10px] font-mono text-[oklch(0.62_0.12_40)] uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 bg-[oklch(0.62_0.12_40)] rounded-full animate-pulse" />
          INTELLIGENCE GRADE DEEPFAKE DETECTION
        </div>

        {/* Logo & Name */}
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
            <div className="relative w-24 h-24 bg-primary/10 border-2 border-primary/40 flex items-center justify-center rotate-45">
              <Shield className="w-14 h-14 text-primary -rotate-45" />
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[oklch(0.62_0.12_40)] uppercase italic leading-none">
            SENTINEL-X
          </h1>
        </div>

        {/* Typewriter tagline */}
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm md:text-base font-mono text-muted-foreground tracking-[0.2em] uppercase text-center max-w-4xl px-6">
            {displayed}
            <span className="animate-pulse text-[oklch(0.62_0.12_40)]">_</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
          A multi-agent AI system for detecting deepfakes across video, image, and audio.
          Built for intelligence teams, forensic analysts, and security researchers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login">
            <button className="relative group overflow-hidden h-12 px-8 rounded-sm bg-[oklch(0.62_0.12_40)] hover:bg-[oklch(0.60_0.15_220)] text-black font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">
              ACCESS PLATFORM
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
            </button>
          </Link>
          <a href="#features">
            <button className="h-12 px-8 rounded-sm border border-[oklch(0.62_0.12_40)]/40 text-[oklch(0.62_0.12_40)] hover:bg-[oklch(0.62_0.12_40)]/10 font-mono uppercase tracking-[0.15em] flex items-center gap-2 transition-colors">
              LEARN MORE
              <ChevronDown size={16} className="animate-bounce" />
            </button>
          </a>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap justify-center gap-6 pt-4">
          {[
            { val: "94.44%", label: "VIDEO ACCURACY" },
            { val: "92.86%", label: "AUDIO ACCURACY" },
            { val: "3", label: "AI AGENTS" },
            { val: "<30s", label: "SCAN TIME" },
          ].map(({ val, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 border border-[oklch(0.62_0.12_40)]/15 bg-[oklch(0.62_0.12_40)]/5 px-4 py-2 rounded-sm">
              <span className="text-xl font-black text-[oklch(0.62_0.12_40)] font-mono">{val}</span>
              <span className="text-[9px] font-mono text-muted-foreground tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] font-mono text-muted-foreground/50 animate-bounce">
        <ChevronDown size={16} />
      </div>
    </section>
  )
}
