import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: profile } = await supabaseClient
      .from('profiles').select('*').eq('id', user.id).single()

    const today = new Date()
    const start = new Date(today.setHours(0,0,0,0)).toISOString()
    const end = new Date(today.setHours(23,59,59,999)).toISOString()

    const { count: taskCount } = await supabaseClient
      .from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('due_date', start).lte('due_date', end).neq('status', 'completed')

    const { count: completedToday } = await supabaseClient
      .from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('completed_at', start).lte('completed_at', end)

    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    const name = profile?.display_name || 'there'
    const streak = profile?.streak_current || 0

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(JSON.stringify({ 
        greeting: `Good ${timeOfDay}, ${name}! You have ${taskCount || 0} tasks today.`,
        taskCount: taskCount || 0, completedToday: completedToday || 0, streak
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are MYPA, a warm friendly productivity AI. Be brief and human.' },
          { role: 'user', content: `Greet ${name}. Time: ${timeOfDay}. Tasks: ${taskCount || 0}. Done: ${completedToday || 0}. Streak: ${streak} days. 1-2 sentences max.` }
        ],
        max_tokens: 60, temperature: 0.9,
      }),
    })

    const data = await res.json()
    const greeting = data.choices?.[0]?.message?.content || `Good ${timeOfDay}, ${name}!`

    return new Response(JSON.stringify({ greeting, taskCount: taskCount || 0, completedToday: completedToday || 0, streak }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
