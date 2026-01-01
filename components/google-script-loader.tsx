"use client"

import Script from "next/script"

interface GoogleScriptLoaderProps {
  clientId: string
}

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

export function GoogleScriptLoader({ clientId }: GoogleScriptLoaderProps) {
  // Don't load script if client ID is invalid
  if (!isValidGoogleClientId(clientId)) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(
        '⚠️ Google OAuth not configured properly.\n' +
        'Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local with a valid Google Client ID.\n' +
        'Get your Client ID from: https://console.cloud.google.com/apis/credentials\n' +
        'Format: xxxxxx-xxxxx.apps.googleusercontent.com'
      )
    }
    return null
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        // Script loaded successfully
        if (typeof window !== 'undefined' && window.google) {
          console.log('Google Sign-In script loaded')
        }
      }}
      onError={(e) => {
        console.error('Failed to load Google Sign-In script:', e)
      }}
    />
  )
}

