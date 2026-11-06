import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createMockClient } from './mockSupabase'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when no Supabase project is configured — the site then runs on local demo data. */
export const isDemoMode = !url || !key || import.meta.env.VITE_DEMO_MODE === 'true'

export const supabase: SupabaseClient = isDemoMode
  ? (createMockClient() as unknown as SupabaseClient)
  : createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage,
      },
    })
