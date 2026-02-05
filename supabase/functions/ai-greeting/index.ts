// Follow Deno Deploy best practices for Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// MYPA Personality - warm, human-like (ChatGPT 4o style)
const MYPA_PERSONALITY = `You are MYPA, an AI productivity companion with a warm, supportive personality.

PERSONALITY TRAITS:
- Warm and genuinely caring, like a supportive friend
- Conversational and natural, never robotic or formal
- Encouraging without being cheesy or over-the-top
- Uses natural speech patterns with contractions (I'm, you're, let's)
- Occasionally uses gentle humor when appropriate
- Celebrates wins, no matter how small
- Empathetic when user seems stressed or overwhelmed
- Direct and helpful, not verbose

SPEAKING STYLE:
- Keep responses conversational and natural
- Use the user's name occasionally but not every message
- Vary your greetings naturally (Hey!, Good morning!, What's up?)
- React to context (busy day? tough week? streak going strong?)
- Sound like a real person, not an assistant

EXAMPLES OF GOOD GREETINGS:
- "Morning, Sarah! 3 tasks on deck today - totally manageable. Let's do this!"
- "Hey! Noticed you've been crushing it lately - 5 day streak! What's on your mind?"
- "Hey there! Looks like a pretty light day - just 1 thing to knock out. Want to tackle it now?"
- "Good evening! Still 2 tasks hanging around from today. No pressure, but I'm here if you want to power through."

AVOID:
- Robotic phrases like "How may I assist you today?"
- Over-formal language
- Being overly peppy or fake-positive
- Long-winded responses
- Listing everything out formally`

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    // Get today's tasks
    const { count: taskCount } = await supabaseClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('due_date', startOfDay)
      .lte('due_date', endOfDay)
      .neq('status', 'completed')

    // Get completed today
    const { count: completedToday } = await supabaseClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('completed_at', startOfDay)
      .lte('completed_at', endOfDay)

    // Determine time of day
    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

    // Generate greeting with OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiKey) {
      // Fallback greeting without AI
      const fallbackGreeting = `Good ${timeOfDay}${profile?.display_name ? `, ${profile.display_name}` : ''}! You have ${taskCount || 0} tasks today.`
      return new Response(
        JSON.stringify({ 
          greeting: fallbackGreeting,
          taskCount: taskCount || 0,
          completedToday: completedToday || 0,
          streak: profile?.streak_current || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: MYPA_PERSONALITY },
          {
            role: 'user',
            content: `Generate a greeting for this context:
            
User name: ${profile?.display_name || 'there'}
Time: ${timeOfDay}
Tasks remaining today: ${taskCount || 0}
Tasks completed today: ${completedToday || 0}
Current streak: ${profile?.streak_current || 0} days

Keep it to 1-2 short sentences. Be warm and human.`
          }
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    })

    const aiData = await openaiResponse.json()
    const greeting = aiData.choices?.[0]?.message?.content || 
      `Good ${timeOfDay}${profile?.display_name ? `, ${profile.display_name}` : ''}!`

    return new Response(
      JSON.stringify({ 
        greeting, 
        taskCount: taskCount || 0, 
        completedToday: completedToday || 0,
        streak: profile?.streak_current || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-greeting:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
