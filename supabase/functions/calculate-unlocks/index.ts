// @ts-nocheck — Deno edge function; not type-checked by Node/TS
// Calculate Unlocks Edge Function
// Checks user progress and grants feature unlocks
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS } from '../_shared/config.ts'

// Unlock definitions with requirements
const UNLOCK_DEFINITIONS = {
  // Day 3 unlocks
  'task_insights': {
    name: 'Task Insights',
    description: 'See AI-powered insights about your task completion patterns',
    requirements: { tasksCompleted: 5, daysActive: 3 }
  },
  'focus_stats': {
    name: 'Focus Statistics',
    description: 'View detailed stats about your focus sessions',
    requirements: { focusSessions: 3, daysActive: 3 }
  },
  
  // Day 7 unlocks
  'ai_sorting': {
    name: 'AI Task Sorting',
    description: 'Let MYPA automatically prioritize your tasks',
    requirements: { daysActive: 7 }
  },
  'duration_estimates': {
    name: 'Duration Estimates',
    description: 'AI estimates how long tasks will take based on your history',
    requirements: { focusSessions: 10, daysActive: 7 }
  },
  
  // Day 14 unlocks
  'challenges': {
    name: 'Challenges',
    description: 'Create and join productivity challenges with friends',
    requirements: { daysActive: 14, inCircle: true }
  },
  'circle_insights': {
    name: 'Circle Insights',
    description: 'See how your circle is performing together',
    requirements: { daysActive: 14, inCircle: true }
  },
  
  // Day 30 unlocks
  'custom_ai_voice': {
    name: 'Custom AI Voice',
    description: 'Choose from different AI voice personalities',
    requirements: { streakDays: 30 }
  },
  'predictive_tasks': {
    name: 'Predictive Tasks',
    description: 'MYPA suggests tasks before you create them',
    requirements: { tasksCompleted: 100, daysActive: 30 }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
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
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Calculate days active
    const createdAt = new Date(profile?.created_at || user.created_at)
    const now = new Date()
    const daysActive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Count completed tasks
    const { count: tasksCompleted } = await supabaseClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    // Count focus sessions
    const { count: focusSessions } = await supabaseClient
      .from('focus_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)

    // Check if user is in a circle
    const { count: circleCount } = await supabaseClient
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const inCircle = (circleCount || 0) > 0
    const streakDays = profile?.streak_current || 0

    // Get existing unlocks
    const { data: existingUnlocks } = await supabaseClient
      .from('unlocks')
      .select('feature')
      .eq('user_id', user.id)

    const unlockedFeatures = new Set(existingUnlocks?.map(u => u.feature) || [])

    // Check each unlock
    const newUnlocks: string[] = []
    const allUnlocks: Array<{ feature: string; unlocked: boolean; progress: any }> = []

    for (const [featureId, definition] of Object.entries(UNLOCK_DEFINITIONS)) {
      const reqs = definition.requirements
      
      // Check if already unlocked
      if (unlockedFeatures.has(featureId)) {
        allUnlocks.push({ feature: featureId, unlocked: true, progress: null })
        continue
      }

      // Check requirements
      let meetsRequirements = true
      const progress: Record<string, { current: number; required: number }> = {}

      if (reqs.daysActive) {
        progress.daysActive = { current: daysActive, required: reqs.daysActive }
        if (daysActive < reqs.daysActive) meetsRequirements = false
      }
      
      if (reqs.tasksCompleted) {
        progress.tasksCompleted = { current: tasksCompleted || 0, required: reqs.tasksCompleted }
        if ((tasksCompleted || 0) < reqs.tasksCompleted) meetsRequirements = false
      }
      
      if (reqs.focusSessions) {
        progress.focusSessions = { current: focusSessions || 0, required: reqs.focusSessions }
        if ((focusSessions || 0) < reqs.focusSessions) meetsRequirements = false
      }
      
      if (reqs.inCircle) {
        progress.inCircle = { current: inCircle ? 1 : 0, required: 1 }
        if (!inCircle) meetsRequirements = false
      }
      
      if (reqs.streakDays) {
        progress.streakDays = { current: streakDays, required: reqs.streakDays }
        if (streakDays < reqs.streakDays) meetsRequirements = false
      }

      if (meetsRequirements) {
        // Grant unlock
        await supabaseClient.from('unlocks').insert({
          user_id: user.id,
          feature: featureId,
          seen: false
        })
        newUnlocks.push(featureId)
        allUnlocks.push({ feature: featureId, unlocked: true, progress: null })
      } else {
        allUnlocks.push({ feature: featureId, unlocked: false, progress })
      }
    }

    return new Response(
      JSON.stringify({
        newUnlocks,
        allUnlocks,
        stats: {
          daysActive,
          tasksCompleted: tasksCompleted || 0,
          focusSessions: focusSessions || 0,
          inCircle,
          streakDays
        }
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in calculate-unlocks:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
