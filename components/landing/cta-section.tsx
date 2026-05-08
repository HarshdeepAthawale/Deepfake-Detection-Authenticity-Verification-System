"use client"

import Link from "next/link"
import { ArrowRight, Lock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="relative py-32 px-6 border-t border-[oklch(0.62_0.12_40)]/20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(100,160,255,0.08),transparent)]" />
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full bg-[linear-gradient(to_right,#4af_1px,transparent_1px),linear-gradient(to_bottom,#4af_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-[oklch(0.62_0.12_40)]/20" />
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-[oklch(0.62_0.12_40)]/20" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-[oklch(0.62_0.12_40)]/20" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-[oklch(0.62_0.12_40)]/20" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
        {/* Classified badge */}
        <div className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/5 px-4 py-1.5 rounded-sm text-[10px] font-mono text-red-400 uppercase tracking-widest">
          <Lock size={10} />
          CLASSIFIED SYSTEM — AUTHORIZED ACCESS ONLY
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-black text-foreground uppercase tracking-tighter leading-none">
            DEFEND <span className="text-[oklch(0.62_0.12_40)]">REALITY.</span>
            <br />
            EXPOSE THE FAKE.
          </h2>
          <p className="text-muted-foreground font-mono text-sm max-w-lg mx-auto leading-relaxed">
            Built for intelligence teams, media forensics units, and security
            researchers. Every scan logged. Every verdict auditable. Every byte encrypted.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link href="/login">
            <button className="relative group overflow-hidden h-14 px-10 rounded-sm bg-[oklch(0.62_0.12_40)] hover:bg-[oklch(0.60_0.15_220)] text-black font-black uppercase tracking-[0.25em] text-sm flex items-center gap-3 transition-colors">
              <Shield size={18} />
              ACCESS PLATFORM
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
            </button>
          </Link>
        </div>

        {/* Footer note */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
          <span>SENTINEL-X v4.1.0</span>
          <span className="text-[oklch(0.62_0.12_40)]/20">·</span>
          <span>AES-256 ENCRYPTED</span>
          <span className="text-[oklch(0.62_0.12_40)]/20">·</span>
          <span>SiglIP + wav2vec2</span>
          <span className="text-[oklch(0.62_0.12_40)]/20">·</span>
          <span>© 2025 SENTINEL_DEFENSE</span>
        </div>
      </div>
    </section>
  )
}
