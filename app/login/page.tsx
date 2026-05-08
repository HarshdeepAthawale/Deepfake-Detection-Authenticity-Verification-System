"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard")
  }, [isAuthenticated, router])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden min-h-screen">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="h-full w-full bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Scanline sweep */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[scanline_4s_linear_infinite]" />
      </div>

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href="/" className="flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 bg-primary/10 border border-primary/40 flex items-center justify-center rounded-sm rotate-45 group-hover:bg-primary/20 transition-all">
              <Shield className="w-10 h-10 text-primary -rotate-45" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-primary uppercase italic">SENTINEL-X</h1>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-[0.2em]">
                Agentic Deepfake Detection Interface
              </p>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div className="relative">
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-primary/40" />
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-primary/40" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-primary/40" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-primary/40" />
          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-foreground font-mono">
          <Link href="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        </p>
      </div>
    </div>
  )
}
