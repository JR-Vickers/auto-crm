/// <reference lib="deno.ns" />
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../src/integrations/supabase/types'

// This will be called by a scheduled job (e.g., AWS EventBridge)
Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Archive tickets older than 90 days
    const { data, error } = await supabaseClient
      .rpc('archive_old_tickets', { days_old: 90 })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Archived ${data} tickets` 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 