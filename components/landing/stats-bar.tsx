"use client"

import { useEffect, useRef, useState } from "react"

const STATS = [
  { value: 94.44, suffix: "%", label: "Video Detection Accuracy", decimals: 2 },
  { value: 92.86, suffix: "%", label: "Audio Detection Accuracy", decimals: 2 },
  { value: 3, suffix: "", label: "Active AI Agents", decimals: 0 },
  { value: 100, suffix: "%", label: "Face Detection Rate", decimals: 0 },
  { value: 256, suffix: "-bit", label: "AES Encryption", decimals: 0 },
  { value: 328, suffix: "ms", label: "Avg Inference Time", decimals: 0 },
]

function useCountUp(target: number, decimals: number, active: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    const duration = 1800
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(current)
      if (current >= target) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [active, target])

  return decimals > 0 ? count.toFixed(decimals) : Math.round(count).toString()
}

function StatItem({ value, suffix, label, decimals, active }: (typeof STATS)[0] & { active: boolean }) {
  const display = useCountUp(value, decimals, active)
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-5 border-r border-primary/10 last:border-r-0 flex-1 min-w-[120px]">
      <div className="text-3xl font-black text-[oklch(0.62_0.12_40)] font-mono tabular-nums">
        {display}
        <span className="text-lg text-[oklch(0.62_0.12_40)]/60">{suffix}</span>
      </div>
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest text-center">{label}</div>
    </div>
  )
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="relative border-y border-primary/20 bg-card/30 backdrop-blur-sm">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap">
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  )
}
