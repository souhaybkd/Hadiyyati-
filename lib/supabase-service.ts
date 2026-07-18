import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service role key.
// It bypasses Row Level Security and must NEVER be imported into client code.
// Used for privileged operations such as reading payment gateway credentials
// and creating orders from server-to-server webhook/callback handlers where no
// user session cookie is available.

let serviceClient: SupabaseClient | null = null

export function createSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return serviceClient
}
