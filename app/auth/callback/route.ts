import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // defaults to '/' if no 'next' param is found
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // CRITICAL FIX:
      // We explicitly grab the "Host" header (e.g., 192.168.0.121:3000)
      // This ensures we redirect back to exactly the same address the user is on.
      const host = request.headers.get('host')
      const protocol = requestUrl.protocol // usually 'http:'

      // Construct the safe URL
      const forwardedUrl = `${protocol}//${host}${next}`
      
      return NextResponse.redirect(forwardedUrl)
    }
  }

  // If login failed, return to an error page
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth-code-error`)
}