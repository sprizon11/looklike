import { createClient } from '@supabase/supabase-js'

let client = null

export function isSupabaseEnabled() {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
}

export function getSupabase() {
  if (!isSupabaseEnabled()) return null
  if (!client) {
    client = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
