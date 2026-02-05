// Voice Command Processing Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to parse natural language dates
function parseDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString()
  
  const lower = dateStr.toLowerCase()
  const now = new Date()
  
  if (lower.includes('today')) {
    return now.toISOString()
  }
  if (lower.includes('tomorrow')) {
    now.setDate(now.getDate() + 1)
    return now.toISOString()
  }
  if (lower.includes('next week')) {
    now.setDate(now.getDate() + 7)
    return now.toISOString()
  }
  if (lower.match(/in (\d+) days?/)) {
    const days = parseInt(lower.match(/in (\d+) days?/)?.[1] || '1')
    now.setDate(now.getDate() + days)
    return now.toISOString()
  }
  
  // Try to parse as actual date
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }
  
  return now.toISOString()
}

// MYPA Voice Personality - same as greeting but for responses
const MYPA_VOICE_PERSONALITY = `You are MYPA, the user's AI productivity companion.

VOICE PERSONALITY:
- Sound like a supportive friend, not an assistant
- Warm, genuine, and conversational
- Use natural speech patterns
- React naturally - "Oh nice!", "Ah gotcha", "Hmm let me think..."
- Keep responses SHORT - this is spoken aloud
- Use contractions always: I'm, you're, let's, don't, can't

RESPONSE STYLE:
- Confirm actions concisely: "Done! Added that to tomorrow."
- Be helpful but brief
- Match user's energy

EXAMPLES:
User: "Add buy groceries tomorrow"
MYPA: "Got it! Added 'buy groceries' for tomorrow."

User: "What do I have today?"
MYPA: "You've got 3 things today - the report, that call with Sarah, and picking up your prescription."

User: "I'm done with the report"
MYPA: "Nice work! Marked that complete. Two more to go today."

AVOID:
- "I'd be happy to help with that!"
- Long explanations
- Robotic confirmations like "Task has been created successfully"`

// Parse voice command intent
function parseIntent(transcript: string): { intent: string; entities: Record<string, any> } {
  const lower = transcript.toLowerCase().trim()
  
  // Add task patterns
  if (lower.match(/^(add|create|new|make)\s+(a\s+)?(task|todo|item)/i) || 
      lower.match(/^(add|remind me to|i need to)/i)) {
    const taskMatch = lower.match(/(?:add|create|new|make|remind me to|i need to)\s+(?:a\s+)?(?:task\s+)?(.+?)(?:\s+(?:for|on|by|due)\s+(.+))?$/i)
    return {
      intent: 'create_task',
      entities: {
        title: taskMatch?.[1]?.trim() || transcript,
        dueDate: taskMatch?.[2] || null
      }
    }
  }
  
  // Complete task patterns
  if (lower.match(/^(done|complete|finish|mark|check off)/i)) {
    const taskMatch = lower.match(/(?:done|complete|finish|mark|check off)\s+(?:with\s+)?(?:the\s+)?(.+)/i)
    return {
      intent: 'complete_task',
      entities: { taskName: taskMatch?.[1]?.trim() || null }
    }
  }
  
  // Delete task patterns (NEW - per Architecture Plan)
  if (lower.match(/^(delete|remove|cancel)\s+(the\s+)?/i) && lower.match(/task/i)) {
    const taskMatch = lower.match(/(?:delete|remove|cancel)\s+(?:the\s+)?(?:task\s+)?(.+)/i)
    return {
      intent: 'delete_task',
      entities: { taskName: taskMatch?.[1]?.replace(/task/i, '')?.trim() || null }
    }
  }
  
  // Move/Defer task patterns (NEW - per Architecture Plan)
  if (lower.match(/^(move|defer|push|reschedule)/i)) {
    const match = lower.match(/(?:move|defer|push|reschedule)\s+(?:the\s+)?(.+?)\s+(?:to\s+)?(.+)$/i)
    return {
      intent: 'move_task',
      entities: { 
        taskName: match?.[1]?.trim() || null,
        newDate: match?.[2]?.trim() || 'tomorrow'
      }
    }
  }
  
  // Query tasks
  if (lower.match(/what('s| do i have| are my)|show me|list/i) && lower.match(/task|todo|today|tomorrow/i)) {
    const timeframe = lower.includes('tomorrow') ? 'tomorrow' : 'today'
    return {
      intent: 'query_tasks',
      entities: { timeframe }
    }
  }
  
  // Start focus
  if (lower.match(/^(start|begin)\s+(a\s+)?focus/i) || lower === 'focus') {
    const durationMatch = lower.match(/(\d+)\s*(min|minute|hour)/i)
    const taskMatch = lower.match(/(?:on|for)\s+(?:the\s+)?(.+?)(?:\s+for|\s*$)/i)
    return {
      intent: 'start_focus',
      entities: { 
        duration: durationMatch ? parseInt(durationMatch[1]) * (durationMatch[2].startsWith('hour') ? 60 : 1) : 25,
        taskName: taskMatch?.[1]?.trim() || null
      }
    }
  }
  
  // Focus commands (NEW - per Architecture Plan Section 10)
  if (lower.match(/how (long|much time)/i) && lower.match(/(left|remain|going|been)/i)) {
    return {
      intent: 'focus_time_check',
      entities: {}
    }
  }
  
  // Add time to focus (NEW)
  if (lower.match(/add\s+(\d+)\s*(min|minute)/i)) {
    const match = lower.match(/add\s+(\d+)\s*(min|minute)/i)
    return {
      intent: 'focus_add_time',
      entities: { minutes: parseInt(match?.[1] || '10') }
    }
  }
  
  // End/stop focus (NEW)
  if (lower.match(/^(stop|end|done|i'm done|finish)/i) && !lower.match(/task/i)) {
    return {
      intent: 'end_focus',
      entities: {}
    }
  }
  
  // What's next (NEW - per Architecture Plan)
  if (lower.match(/what('s| is) next/i) || lower.match(/next task/i)) {
    return {
      intent: 'whats_next',
      entities: {}
    }
  }
  
  // Streak query (NEW)
  if (lower.match(/streak|how many days/i)) {
    return {
      intent: 'streak_check',
      entities: {}
    }
  }
  
  // Challenge status (NEW)
  if (lower.match(/challenge/i) && lower.match(/how|status|going|doing/i)) {
    return {
      intent: 'challenge_status',
      entities: {}
    }
  }
  
  // Nudge someone (NEW - per Architecture Plan)
  if (lower.match(/^nudge\s+/i)) {
    const match = lower.match(/nudge\s+(\w+)/i)
    return {
      intent: 'nudge',
      entities: { personName: match?.[1] || null }
    }
  }
  
  // Status check
  if (lower.match(/how('?s| am i)|status|progress/i)) {
    return { intent: 'status', entities: {} }
  }
  
  // Navigation
  if (lower.match(/^(go to|open|show)\s+(tasks?|social|profile|circles?|challenges?)/i)) {
    const screenMatch = lower.match(/(tasks?|social|profile|circles?|challenges?)/i)
    return {
      intent: 'navigate',
      entities: { screen: screenMatch?.[1]?.toLowerCase() || 'tasks' }
    }
  }
  
  // Default: conversational
  return { intent: 'conversation', entities: { message: transcript } }
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBase64: string): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) throw new Error('OpenAI API key not configured')
  
  // Convert base64 to blob
  const binaryString = atob(audioBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const audioBlob = new Blob([bytes], { type: 'audio/m4a' })
  
  // Create form data
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.m4a')
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Whisper API error: ${error}`)
  }
  
  const result = await response.json()
  return result.text || ''
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    let transcript = body.transcript
    const { audio, context } = body
    
    // If audio is provided, transcribe it first
    if (audio && !transcript) {
      try {
        transcript = await transcribeAudio(audio)
      } catch (err) {
        console.error('Transcription error:', err)
        return new Response(
          JSON.stringify({ error: 'Failed to transcribe audio' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
    
    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'No transcript or audio provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse intent
    const { intent, entities } = parseIntent(transcript)
    let message = ''
    let action = null

    switch (intent) {
      case 'create_task': {
        const dueDate = parseDate(entities.dueDate) || new Date().toISOString()
        const { data: task, error } = await supabaseClient
          .from('tasks')
          .insert({
            user_id: user.id,
            title: entities.title,
            due_date: dueDate,
            priority: 'medium'
          })
          .select()
          .single()
        
        if (error) {
          message = "Hmm, couldn't add that task. Mind trying again?"
        } else {
          const dateLabel = entities.dueDate?.includes('tomorrow') ? 'for tomorrow' : 'to your list'
          message = `Got it! Added "${entities.title}" ${dateLabel}.`
          action = { type: 'task_created', payload: task }
        }
        break
      }

      case 'complete_task': {
        // Find matching task
        const { data: tasks } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'completed')
          .ilike('title', `%${entities.taskName}%`)
          .limit(1)
        
        if (tasks && tasks.length > 0) {
          const { error } = await supabaseClient
            .from('tasks')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', tasks[0].id)
          
          if (!error) {
            message = `Nice work! Marked "${tasks[0].title}" complete.`
            action = { type: 'task_completed', payload: { taskId: tasks[0].id } }
          } else {
            message = "Couldn't mark that complete. Try again?"
          }
        } else {
          message = `I couldn't find a task matching "${entities.taskName}". What's it called?`
        }
        break
      }

      case 'query_tasks': {
        const today = new Date()
        let startDate: Date, endDate: Date
        
        if (entities.timeframe === 'tomorrow') {
          startDate = new Date(today.setDate(today.getDate() + 1))
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(startDate)
          endDate.setHours(23, 59, 59, 999)
        } else {
          startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date()
          endDate.setHours(23, 59, 59, 999)
        }
        
        const { data: tasks } = await supabaseClient
          .from('tasks')
          .select('title')
          .eq('user_id', user.id)
          .gte('due_date', startDate.toISOString())
          .lte('due_date', endDate.toISOString())
          .neq('status', 'completed')
          .limit(5)
        
        if (!tasks || tasks.length === 0) {
          message = entities.timeframe === 'tomorrow' 
            ? "Tomorrow's looking clear! Nothing scheduled yet."
            : "You're all clear for today! Nice work."
        } else if (tasks.length === 1) {
          message = `Just one thing ${entities.timeframe}: ${tasks[0].title}.`
        } else {
          const taskList = tasks.map(t => t.title).join(', ')
          message = `You've got ${tasks.length} things ${entities.timeframe}: ${taskList}.`
        }
        action = { type: 'query', payload: { tasks, timeframe: entities.timeframe } }
        break
      }

      case 'start_focus': {
        message = `Starting a ${entities.duration} minute focus session. You've got this!`
        action = { type: 'start_focus', payload: { duration: entities.duration, taskName: entities.taskName } }
        break
      }

      case 'focus_time_check': {
        // This is handled by the frontend focus modal with current session data
        message = "Let me check..."
        action = { type: 'focus_time_check', payload: {} }
        break
      }

      case 'focus_add_time': {
        message = `Adding ${entities.minutes} more minutes to your session. Keep going!`
        action = { type: 'focus_add_time', payload: { minutes: entities.minutes } }
        break
      }

      case 'end_focus': {
        message = "Nice work! Ending your focus session."
        action = { type: 'end_focus', payload: {} }
        break
      }

      case 'whats_next': {
        const { data: nextTask } = await supabaseClient
          .from('tasks')
          .select('title, priority')
          .eq('user_id', user.id)
          .neq('status', 'completed')
          .order('due_date', { ascending: true })
          .order('priority', { ascending: false })
          .limit(1)
          .single()
        
        if (nextTask) {
          message = `Next up: "${nextTask.title}". Want to start focusing on it?`
          action = { type: 'show_task', payload: nextTask }
        } else {
          message = "You're all caught up! No tasks pending."
        }
        break
      }

      case 'delete_task': {
        const { data: tasks } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .ilike('title', `%${entities.taskName}%`)
          .limit(1)
        
        if (tasks && tasks.length > 0) {
          const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', tasks[0].id)
          
          if (!error) {
            message = `Deleted "${tasks[0].title}".`
            action = { type: 'task_deleted', payload: { taskId: tasks[0].id } }
          } else {
            message = "Couldn't delete that task. Try again?"
          }
        } else {
          message = `Couldn't find a task matching "${entities.taskName}".`
        }
        break
      }

      case 'move_task': {
        const { data: tasks } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'completed')
          .ilike('title', `%${entities.taskName}%`)
          .limit(1)
        
        if (tasks && tasks.length > 0) {
          const newDate = parseDate(entities.newDate)
          const { error } = await supabaseClient
            .from('tasks')
            .update({ due_date: newDate })
            .eq('id', tasks[0].id)
          
          if (!error) {
            const dateLabel = entities.newDate?.includes('tomorrow') ? 'tomorrow' : entities.newDate
            message = `Moved "${tasks[0].title}" to ${dateLabel}.`
            action = { type: 'task_moved', payload: { taskId: tasks[0].id, newDate } }
          } else {
            message = "Couldn't move that task. Try again?"
          }
        } else {
          message = `Couldn't find a task matching "${entities.taskName}".`
        }
        break
      }

      case 'streak_check': {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('streak_current, streak_longest')
          .eq('id', user.id)
          .single()
        
        if (profile?.streak_current && profile.streak_current > 0) {
          message = `You're on a ${profile.streak_current} day streak! ${profile.streak_current >= profile.streak_longest ? "That's your best yet!" : `Your record is ${profile.streak_longest} days.`}`
        } else {
          message = "No streak yet. Complete a task today to start one!"
        }
        action = { type: 'streak_check', payload: profile }
        break
      }

      case 'challenge_status': {
        const { data: participation } = await supabaseClient
          .from('challenge_participants')
          .select('progress, challenge:challenges(title, goal_value)')
          .eq('user_id', user.id)
          .limit(1)
          .single()
        
        if (participation?.challenge) {
          const challenge = participation.challenge as any
          const percent = Math.round((participation.progress / challenge.goal_value) * 100)
          message = `In "${challenge.title}", you're at ${percent}% - ${participation.progress} of ${challenge.goal_value}. Keep pushing!`
        } else {
          message = "You're not in any active challenges right now. Want to join one?"
        }
        action = { type: 'challenge_status', payload: participation }
        break
      }

      case 'nudge': {
        // For now, just acknowledge - would need circle member lookup
        message = `I'll send a nudge to ${entities.personName}!`
        action = { type: 'nudge', payload: { personName: entities.personName } }
        break
      }

      case 'status': {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('xp, level, streak_current')
          .eq('id', user.id)
          .single()
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { count: completedToday } = await supabaseClient
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('completed_at', today.toISOString())
        
        if (profile?.streak_current && profile.streak_current > 2) {
          message = `You're on a ${profile.streak_current} day streak! Completed ${completedToday || 0} tasks today. Keep it going!`
        } else {
          message = `You've knocked out ${completedToday || 0} tasks today. Level ${profile?.level || 1}, ${profile?.xp || 0} XP total.`
        }
        action = { type: 'status', payload: profile }
        break
      }

      case 'navigate': {
        const screenMap: Record<string, string> = {
          'tasks': 'tasks',
          'task': 'tasks',
          'social': 'social',
          'circles': 'social',
          'circle': 'social',
          'challenges': 'social',
          'challenge': 'social',
          'profile': 'profile'
        }
        const screen = screenMap[entities.screen] || 'tasks'
        message = `Opening ${screen}.`
        action = { type: 'navigate', payload: { screen } }
        break
      }

      default: {
        // Conversational - use AI
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (openaiKey) {
          const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4-turbo-preview',
              messages: [
                { role: 'system', content: MYPA_VOICE_PERSONALITY },
                { role: 'user', content: transcript }
              ],
              max_tokens: 150,
              temperature: 0.8,
            }),
          })
          const aiData = await aiResponse.json()
          message = aiData.choices?.[0]?.message?.content || "I'm here! What can I help with?"
        } else {
          message = "I'm here! You can ask me to add tasks, check your schedule, or start a focus session."
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        message,
        action,
        shouldSpeak: true,
        intent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in voice-command:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
