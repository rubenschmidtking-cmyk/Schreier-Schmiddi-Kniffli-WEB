import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const realtimeConfigured = Boolean(url && key)
export const supabaseProjectHost = (() => {
  try { return url ? new URL(url).host : '' } catch { return '' }
})()

let clientRef: SupabaseClient | null = null

// Keep the Realtime client deliberately simple. Supabase Realtime already has its own
// reconnect/backoff logic. Running a second remove/recreate loop on every socket error
// can create reconnect races, especially on iOS when a PWA resumes from background.
export const supabase = realtimeConfigured
  ? (clientRef = createClient(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: {
        worker: true,
        heartbeatIntervalMs: 15000,
      },
    }))
  : null

export function nudgeRealtimeConnection() {
  try { clientRef?.realtime.connect() } catch {}
}
