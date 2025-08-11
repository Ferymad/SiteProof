import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../types/database'

// Client-side Supabase client for browser usage
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Create a singleton client for browser usage
export const supabase = createClient()