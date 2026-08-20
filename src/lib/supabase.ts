import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const realtimeConfigured = Boolean(url && key)

let clientRef: SupabaseClient | null = null

export const supabase = realtimeConfigured
  ? (clientRef = createClient(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: {
        worker: true,
        heartbeatCallback: (status) => {
          if (status === 'disconnected') {
            try { clientRef?.realtime.connect() } catch {}
          }
        },
      },
    }))
  : null
