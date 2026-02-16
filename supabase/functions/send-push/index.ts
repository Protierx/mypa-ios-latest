// @ts-nocheck — Deno edge function; not type-checked by Node/TS
// Push Notification Edge Function
// SECURITY NOTE: Uses service-role client. No JWT auth — intended for
// server-side invocation (cron jobs, triggers), not direct client calls.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS } from '../_shared/config.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { userId, title, body, data } = await req.json()

    if (!userId || !title) {
      return new Response(
        JSON.stringify({ error: 'userId and title are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client to access user data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user's push token from profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.push_token) {
      console.log('No push token for user:', userId)
      return new Response(
        JSON.stringify({ success: false, error: 'No push token found' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Send via Expo Push API
    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: profile.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }),
    })

    const pushResult = await pushResponse.json()

    // Log notification in database
    // Derive category from the notification type
    const notifType = data?.type || 'general'
    const SOCIAL_TYPES = ['CHALLENGE_CREATED', 'CHALLENGE_ENDING_SOON', 'CHALLENGE_CHECKIN_APPROVED']
    const TASK_TYPES = ['TASK_DUE_SOON', 'TASK_OVERDUE_SUMMARY', 'DAILY_PLANNING_REMINDER']
    const notifCategory = SOCIAL_TYPES.includes(notifType) ? 'social'
      : TASK_TYPES.includes(notifType) ? 'tasks'
      : 'system'

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: notifType,
      title,
      body,
      data: data || {},
      category: notifCategory,
    })

    return new Response(
      JSON.stringify({ success: true, result: pushResult }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-push:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
