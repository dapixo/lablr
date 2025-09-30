import { createBrowserClient } from '@supabase/ssr'
import { validateSupabaseClientEnv } from '../env-validation'

export function createClient() {
  const env = validateSupabaseClientEnv()

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}
