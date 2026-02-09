/**
 * Daily Brief Edge Function
 * 
 * Generates a personalized morning briefing for the user including:
 * - Task summary
 * - Peak hour suggestions
 * - Challenge updates
 * - Streak status
 * - Motivational insights
 * 
 * Reference: MYPA_FULL_IMPLEMENTATION_GUIDE.md Phase 6, Step 6.8
 * Reference: MYPA_ARCHITECTURE_PLAN.md Section 5 "Learning System"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MODEL_CONFIG, CORS_HEADERS } from '../_shared/config.ts'

const corsHeaders = CORS_HEADERS

// MYPA Daily Brief Personality
const MYPA_BRIEF_PERSONALITY = `You are MYPA giving a morning briefing to help the user start their day.

TONE:
- Warm and encouraging, like a supportive friend
- Concise but personal
- Energizing without being fake
- Adapt to the user's situation (busy day vs light day)

FORMAT:
- Keep it to 2-3 sentences max
- Start with a greeting
- Mention the most important thing for today
- End with something encouraging or a quick tip

EXAMPLES:
- "Morning! You've got 3 things on deck today, with that project proposal being the big one. Your peak focus time is coming up at 9am - let's knock it out!"
- "Hey there! Light day ahead - just 1 task. Perfect chance to get ahead on tomorrow's stuff or just enjoy the breathing room."
- "Rise and shine! 5 tasks today but you're on a 7-day streak, so I know you've got this. Start with the urgent ones while you're fresh."

AVOID:
- Long lists
- Corporate speak
- Being overly enthusiastic
- Mentioning every single detail`

interface DailyBriefResponse {
  greeting: string;
  summary: {
    totalTasks: number;
    highPriorityCount: number;
    completedYesterday: number;
  };
  peakHourSuggestion: string | null;
  challengeUpdate: string | null;
  streakStatus: {
    current: number;
    message: string | null;
  };
  motivationalInsight: string | null;
  briefText: string; // The full spoken brief
}

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

    // Parse request body for cache check option (safe: no body or invalid JSON is OK)
    let checkCache = false
    try {
      const text = await req.text()
      if (text && text.length > 0) {
        const body = JSON.parse(text) as { check_cache?: boolean }
        checkCache = body?.check_cache === true
      }
    } catch {
      // No body or invalid JSON -- proceed without cache check
    }

    // Get user profile (always needed for timezone + display_name)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // ---- Server-side cache check (PRD R2.3) ----
    // If check_cache=true and briefing was already generated today, return cached text
    if (checkCache && profile) {
      const userTimezone = profile.timezone || 'America/New_York'
      const todayInUserTz = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone }) // YYYY-MM-DD
      
      if (profile.briefing_date === todayInUserTz && profile.briefing_cache) {
        console.log('[daily-brief] Returning cached brief for', todayInUserTz)
        return new Response(
          JSON.stringify({
            greeting: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}!`,
            summary: { totalTasks: 0, highPriorityCount: 0, completedYesterday: 0 },
            peakHourSuggestion: null,
            challengeUpdate: null,
            streakStatus: { current: profile.streak_current || 0, message: null },
            motivationalInsight: null,
            briefText: profile.briefing_cache,
            cached: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // Get user model for peak hours
    const { data: userModel } = await supabaseClient
      .from('user_model')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get today's date range
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Get today's tasks
    const { data: todayTasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', today.toISOString())
      .lt('due_date', tomorrow.toISOString())
      .neq('status', 'completed')

    const totalTasks = todayTasks?.length || 0
    const highPriorityCount = todayTasks?.filter(t => 
      t.priority === 'high' || t.priority === 'urgent'
    ).length || 0

    // Get yesterday's completed tasks
    const { count: completedYesterday } = await supabaseClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('completed_at', yesterday.toISOString())
      .lt('completed_at', today.toISOString())

    // Get active challenges
    const { data: activeParticipations } = await supabaseClient
      .from('challenge_participants')
      .select(`
        progress,
        challenges (
          id,
          title,
          goal_value,
          ends_at
        )
      `)
      .eq('user_id', user.id)

    // Build peak hour suggestion
    let peakHourSuggestion: string | null = null
    if (userModel?.peak_hours && userModel.peak_hours.length > 0) {
      const currentHour = now.getHours()
      const peakHours = userModel.peak_hours as number[]
      
      // Find next peak hour
      const nextPeakHour = peakHours.find(h => h >= currentHour)
      if (nextPeakHour !== undefined) {
        const isPeakNow = peakHours.includes(currentHour)
        if (isPeakNow) {
          peakHourSuggestion = "You're in your peak focus time right now!"
        } else {
          const hoursUntil = nextPeakHour - currentHour
          peakHourSuggestion = `Peak focus time coming up in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`
        }
      }
    }

    // Build challenge update
    let challengeUpdate: string | null = null
    if (activeParticipations && activeParticipations.length > 0) {
      const firstChallenge = activeParticipations[0]
      const challenge = firstChallenge.challenges as any
      if (challenge) {
        const progressPercent = Math.round((firstChallenge.progress / challenge.goal_value) * 100)
        const daysLeft = Math.ceil(
          (new Date(challenge.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        challengeUpdate = `${challenge.title}: ${progressPercent}% complete, ${daysLeft} days left`
      }
    }

    // Build streak message
    let streakMessage: string | null = null
    const currentStreak = profile?.streak_current || 0
    if (currentStreak >= 7) {
      streakMessage = `Amazing ${currentStreak}-day streak! 🔥`
    } else if (currentStreak >= 3) {
      streakMessage = `${currentStreak}-day streak going!`
    } else if (currentStreak > 0) {
      streakMessage = `Day ${currentStreak} of your streak`
    }

    // Build motivational insight based on recent performance
    let motivationalInsight: string | null = null
    if ((completedYesterday || 0) >= 5) {
      motivationalInsight = `You crushed ${completedYesterday} tasks yesterday!`
    } else if (totalTasks === 0) {
      motivationalInsight = "Clear schedule today - great time to get ahead!"
    } else if (highPriorityCount > 0) {
      motivationalInsight = `${highPriorityCount} important ${highPriorityCount > 1 ? 'tasks' : 'task'} to focus on`
    }

    // Generate AI brief using OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    let briefText = ''

    if (openaiKey) {
      const timeOfDay = now.getHours() < 12 ? 'morning' : 
                        now.getHours() < 17 ? 'afternoon' : 'evening'
      
      const context = `
User: ${profile?.display_name || 'there'}
Time: ${timeOfDay}
Tasks today: ${totalTasks}
High priority: ${highPriorityCount}
Completed yesterday: ${completedYesterday || 0}
Current streak: ${currentStreak} days
Peak hour info: ${peakHourSuggestion || 'unknown'}
Challenge: ${challengeUpdate || 'none active'}
`

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL_CONFIG.cached,
            messages: [
              { role: 'system', content: MYPA_BRIEF_PERSONALITY },
              { 
                role: 'user', 
                content: `Generate a daily briefing for this context:\n${context}\n\nKeep it to 2-3 sentences, warm and natural.` 
              }
            ],
            max_tokens: 150,
            temperature: 0.8,
          }),
        })

        const aiData = await openaiResponse.json()
        briefText = aiData.choices?.[0]?.message?.content || ''
      } catch (e) {
        console.error('OpenAI error:', e)
      }
    }

    // Fallback brief if OpenAI fails
    if (!briefText) {
      const timeGreeting = now.getHours() < 12 ? 'Good morning' : 
                          now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
      
      if (totalTasks === 0) {
        briefText = `${timeGreeting}! You're all clear today. Great time to get ahead or just enjoy the breathing room.`
      } else if (totalTasks <= 3) {
        briefText = `${timeGreeting}! You've got ${totalTasks} task${totalTasks > 1 ? 's' : ''} today - totally manageable. ${streakMessage ? streakMessage + ' ' : ''}Let's do this!`
      } else {
        briefText = `${timeGreeting}! ${totalTasks} tasks on deck today${highPriorityCount > 0 ? `, ${highPriorityCount} are high priority` : ''}. ${peakHourSuggestion || "Let's knock them out!"}`
      }
    }

    // ---- Cache write (PRD R2.3) ----
    // Cache the generated brief so subsequent calls today return instantly
    if (briefText && profile) {
      const userTimezone = profile.timezone || 'America/New_York'
      const todayInUserTz = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone })
      
      await supabaseClient
        .from('profiles')
        .update({
          briefing_cache: briefText,
          briefing_date: todayInUserTz,
        })
        .eq('id', user.id)
    }

    const response: DailyBriefResponse = {
      greeting: `Good ${now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}!`,
      summary: {
        totalTasks,
        highPriorityCount,
        completedYesterday: completedYesterday || 0,
      },
      peakHourSuggestion,
      challengeUpdate,
      streakStatus: {
        current: currentStreak,
        message: streakMessage,
      },
      motivationalInsight,
      briefText,
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Daily brief error:', message, error)
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
