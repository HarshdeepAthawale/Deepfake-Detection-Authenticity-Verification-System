"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Lock, User, ArrowRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export function LoginForm() {
  const { login, signup, loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [activeTab, setActiveTab] = useState("login")
  const googleButtonLoginRef = useRef<HTMLDivElement>(null)
  const googleButtonSignupRef = useRef<HTMLDivElement>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  // Validate Google Client ID format
  const isValidGoogleClientId = (clientId: string): boolean => {
    if (!clientId || clientId.trim() === '') return false
    // Check if it's a placeholder or invalid format
    if (
      clientId.includes('your-google-client-id') ||
      clientId.includes('your-client-id') ||
      clientId === 'placeholder' ||
      !clientId.includes('.apps.googleusercontent.com')
    ) {
      return false
    }
    return true
  }

  const validGoogleClientId = isValidGoogleClientId(googleClientId)

  // Warn if Google Client ID is missing or invalid
  useEffect(() => {
    if (!validGoogleClientId && typeof window !== 'undefined') {
      console.error(
        '❌ Google OAuth Configuration Error:\n' +
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing or invalid.\n\n' +
        'To fix this:\n' +
        '1. Go to https://console.cloud.google.com/apis/credentials\n' +
        '2. Create an OAuth 2.0 Client ID (Web application)\n' +
        '3. Add authorized origin: http://localhost:3002\n' +
        '4. Copy the Client ID\n' +
        '5. Update .env.local with:\n' +
        '   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com\n\n' +
        'Current value: ' + (googleClientId || '(empty)')
      )
    }
  }, [googleClientId, validGoogleClientId])

  const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
    setLoading(true)
    setError(null)

    try {
      await loginWithGoogle(response.credential)
      // Redirect is handled by auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google authentication failed")
      setLoading(false)
    }
  }, [loginWithGoogle])

  // Initialize Google Sign-In
  useEffect(() => {
    if (!validGoogleClientId) return

    const initializeButton = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (!ref.current) return
      
      // Clear existing content
      ref.current.innerHTML = ""

      // Wait for Google script to load
      const checkGoogle = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleSignIn,
              error_callback: (error: any) => {
                console.error('Google Sign-In error:', error)
                if (error.type === 'popup_closed_by_user') {
                  setError('Sign-in cancelled')
                } else if (error.type === 'popup_failed_to_open') {
                  setError('Failed to open sign-in window. Please check popup blockers.')
                } else {
                  setError('Google sign-in failed. Please check your OAuth configuration.')
                }
                setLoading(false)
              },
            })

            window.google.accounts.id.renderButton(ref.current!, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "signin_with",
              width: "100%",
            })
          } catch (err) {
            console.error("Error initializing Google Sign-In:", err)
          }
        } else {
          // Retry after a short delay
          setTimeout(checkGoogle, 100)
        }
      }

      checkGoogle()
    }

    // Initialize based on active tab
    const timer = setTimeout(() => {
      if (activeTab === "login") {
        initializeButton(googleButtonLoginRef)
      } else {
        initializeButton(googleButtonSignupRef)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [validGoogleClientId, googleClientId, activeTab, handleGoogleSignIn])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      // Redirect is handled by auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signup(email, password)
      // Redirect is handled by auth context
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-2xl overflow-hidden group">
      <CardContent className="pt-8 pb-6 px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/30">
            <TabsTrigger 
              value="login" 
              className="text-[10px] font-mono font-bold uppercase tracking-widest data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="text-[10px] font-mono font-bold uppercase tracking-widest data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
                      <User size={16} />
                    </div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/50 border-primary/20 focus-visible:ring-primary/40 pl-10 font-mono text-sm placeholder:text-muted-foreground/30"
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
                      <Lock size={16} />
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 border-primary/20 focus-visible:ring-primary/40 pl-10 font-mono text-sm placeholder:text-muted-foreground/30"
                      placeholder="••••••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-mono flex items-center gap-2 uppercase tracking-tighter">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] h-12 rounded-sm relative group overflow-hidden"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Decrypting..." : "Initialize Session"}
                  {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              </Button>

              {validGoogleClientId && (
                <>
                  <div className="flex items-center gap-4 my-4">
                    <Separator className="flex-1" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">OR</span>
                    <Separator className="flex-1" />
                  </div>
                  <div ref={googleButtonLoginRef} className="w-full flex justify-center" />
                </>
              )}
              {!validGoogleClientId && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-mono flex items-center gap-2 uppercase tracking-tighter">
                  <AlertTriangle size={14} />
                  Google Sign-In not configured. Please set a valid NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local
                </div>
              )}

            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-0">
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
                      <User size={16} />
                    </div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/50 border-primary/20 focus-visible:ring-primary/40 pl-10 font-mono text-sm placeholder:text-muted-foreground/30"
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">
                      <Lock size={16} />
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 border-primary/20 focus-visible:ring-primary/40 pl-10 font-mono text-sm placeholder:text-muted-foreground/30"
                      placeholder="••••••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-mono flex items-center gap-2 uppercase tracking-tighter">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] h-12 rounded-sm relative group overflow-hidden"
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? "Registering..." : "Create Account"}
                  {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              </Button>

              {validGoogleClientId && (
                <>
                  <div className="flex items-center gap-4 my-4">
                    <Separator className="flex-1" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">OR</span>
                    <Separator className="flex-1" />
                  </div>
                  <div ref={googleButtonSignupRef} className="w-full flex justify-center" />
                </>
              )}
              {!validGoogleClientId && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-mono flex items-center gap-2 uppercase tracking-tighter">
                  <AlertTriangle size={14} />
                  Google Sign-In not configured. Please set a valid NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local
                </div>
              )}

            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
