import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

type CookieToSet = {
  name: string
  value: string
  options?: Partial<{
    domain?: string
    expires?: Date
    httpOnly?: boolean
    maxAge?: number
    path?: string
    priority?: 'low' | 'medium' | 'high'
    sameSite?: boolean | 'lax' | 'strict' | 'none'
    secure?: boolean
  }>
}

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  onCookiesToSet: (cookies: CookieToSet[]) => void,
): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        onCookiesToSet(cookiesToSet)
      },
    },
  })
}
