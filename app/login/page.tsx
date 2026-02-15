'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent', // Forces the "Allow" screen
        },
      },
    })

    if (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl liquid-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl liquid-blob" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl liquid-blob" style={{ animationDelay: '6s' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title Area */}
        <div className="text-center mb-12 fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass mb-6 group cursor-default">
            <svg className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h1 className="text-5xl font-light tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400" 
              style={{ fontFamily: "'Crimson Pro', serif" }}>
            Bookmarks
          </h1>
          <p className="text-gray-400 text-sm tracking-wide">Your personal collection, beautifully organized</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-3xl p-8 space-y-6 fade-in-up stagger-1">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-medium text-gray-200">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to access your bookmarks</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full glass glass-hover rounded-2xl px-6 py-4 font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
          >
            {loading && (
              <div className="absolute inset-0 shimmer"></div>
            )}
            <span className="flex items-center justify-center gap-3 relative">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </span>
          </button>

          <div className="pt-6 border-t border-white/5">
            <p className="text-center text-xs text-gray-600">
              Secure authentication powered by Supabase
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600 fade-in-up stagger-2">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  )
}