// =================================================================
// POST /create-challenge
// Creates a new challenge with full validation, auto-joins creator
// =================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';

// ---------- Validation constants ----------
const TITLE_MIN = 3;
const TITLE_MAX = 60;
const VALID_TRACKING_METHODS = ['tasks_completed', 'focus_minutes', 'active_days', 'proof_checkin'] as const;
const VALID_DURATIONS = [7, 14, 30] as const;
const VALID_VERIFICATION_MODES = ['auto_accept', 'creator_approval'] as const;

// ---------- Legacy type mapping ----------
const TRACKING_TO_LEGACY_TYPE: Record<string, string> = {
  tasks_completed: 'tasks_completed',
  focus_minutes: 'focus_time',
  active_days: 'daily_checkin',
  proof_checkin: 'daily_checkin', // closest legacy type
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    // ---------- Auth ----------
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;

    // ---------- Parse & validate body ----------
    const body = await req.json();
    const {
      circleId,
      title,
      description,
      trackingMethod,
      targetValue,
      durationDays,
      verificationMode,
      emoji,
    } = body;

    const errors: string[] = [];

    // Title validation
    const trimmedTitle = (title || '').trim();
    if (!trimmedTitle) {
      errors.push('title is required');
    } else if (trimmedTitle.length < TITLE_MIN) {
      errors.push(`title must be at least ${TITLE_MIN} characters`);
    } else if (trimmedTitle.length > TITLE_MAX) {
      errors.push(`title must be at most ${TITLE_MAX} characters`);
    }

    // Tracking method validation
    if (!trackingMethod) {
      errors.push('trackingMethod is required');
    } else if (!VALID_TRACKING_METHODS.includes(trackingMethod)) {
      errors.push(`trackingMethod must be one of: ${VALID_TRACKING_METHODS.join(', ')}`);
    }

    // Target value validation
    const target = Number(targetValue);
    if (!targetValue || isNaN(target) || target <= 0 || !Number.isInteger(target)) {
      errors.push('targetValue must be a positive integer');
    }

    // Duration validation
    const duration = Number(durationDays);
    if (!durationDays || !VALID_DURATIONS.includes(duration as any)) {
      errors.push(`durationDays must be one of: ${VALID_DURATIONS.join(', ')}`);
    }

    // Active days constraint: target <= duration
    if (trackingMethod === 'active_days' && target > duration) {
      errors.push(`For active_days, targetValue (${target}) must be <= durationDays (${duration})`);
    }

    // Verification mode validation (only for proof_checkin)
    let finalVerificationMode: string | null = null;
    if (trackingMethod === 'proof_checkin') {
      finalVerificationMode = verificationMode || 'auto_accept';
      if (!VALID_VERIFICATION_MODES.includes(finalVerificationMode as any)) {
        errors.push(`verificationMode must be one of: ${VALID_VERIFICATION_MODES.join(', ')}`);
      }
    }

    // Circle validation (if provided)
    if (circleId) {
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .select('id')
        .eq('id', circleId)
        .maybeSingle();

      if (circleError || !circle) {
        errors.push('Circle not found');
      }
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Compute dates ----------
    const startAt = new Date();
    const endAt = new Date(startAt);
    endAt.setDate(endAt.getDate() + duration);

    // ---------- Insert challenge ----------
    const legacyType = TRACKING_TO_LEGACY_TYPE[trackingMethod] || 'custom';
    const trimmedDesc = description?.trim() || null;

    const { data: challenge, error: insertError } = await supabase
      .from('challenges')
      .insert({
        title: trimmedTitle,
        emoji: emoji || '🏆',
        description: trimmedDesc,
        creator_id: userId,
        circle_id: circleId || null,
        type: legacyType,
        tracking_method: trackingMethod,
        verification_mode: finalVerificationMode,
        goal_value: target,
        duration_days: duration,
        starts_at: startAt.toISOString(),
        ends_at: endAt.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Challenge insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create challenge', details: [insertError.message] }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- Auto-join creator as participant ----------
    const { error: participantError } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challenge.id,
        user_id: userId,
        progress: 0,
      });

    if (participantError) {
      console.error('Participant insert error:', participantError);
      // Don't fail the whole request — challenge is created
    }

    // ---------- Initialize challenge_progress for creator ----------
    await supabase
      .from('challenge_progress')
      .upsert({
        challenge_id: challenge.id,
        user_id: userId,
        progress_value: 0,
        updated_at: new Date().toISOString(),
      });

    // ---------- Post to circle feed (if circle challenge) ----------
    if (circleId) {
      await supabase
        .from('circle_posts')
        .insert({
          circle_id: circleId,
          user_id: userId,
          type: 'challenge_created',
          payload: {
            challenge_id: challenge.id,
            title: trimmedTitle,
            tracking_method: trackingMethod,
            target_value: target,
            duration_days: duration,
          },
        });

      // ---------- Notification fanout to circle members ----------
      // Use service-role client to insert notifications for other members
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      // Fetch circle name for notification text
      const { data: circleData } = await adminClient
        .from('circles')
        .select('name')
        .eq('id', circleId)
        .single();
      const circleName = circleData?.name || 'your circle';

      // Fetch all circle members except the creator
      const { data: members } = await adminClient
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId)
        .neq('user_id', userId);

      if (members && members.length > 0) {
        const notificationRows = members.map((m: { user_id: string }) => ({
          user_id: m.user_id,
          type: 'CHALLENGE_CREATED',
          category: 'social',
          title: `${emoji || '🏆'} New Challenge in ${circleName}`,
          body: `"${trimmedTitle}" \u2014 tap to preview & join!`,
          data: {
            challenge_id: challenge.id,
            circle_id: circleId,
            circle_name: circleName,
            challenge_title: trimmedTitle,
            emoji: emoji || '🏆',
          },
          read: false,
        }));

        const { error: notifError } = await adminClient
          .from('notifications')
          .insert(notificationRows);

        if (notifError) {
          console.error('Notification fanout error:', notifError);
          // Non-fatal — challenge is already created
        } else {
          console.log(`[create-challenge] Notified ${members.length} circle members`);
        }
      }
    }

    // ---------- Log event ----------
    await supabase
      .from('events')
      .insert({
        event_id: crypto.randomUUID(),
        user_id: userId,
        type: 'challenge_created',
        payload: {
          challenge_id: challenge.id,
          tracking_method: trackingMethod,
          target_value: target,
          duration_days: duration,
          circle_id: circleId || null,
        },
        occurred_at: new Date().toISOString(),
      });

    // ---------- Response ----------
    return new Response(
      JSON.stringify({
        ok: true,
        challenge: {
          ...challenge,
          tracking_method: trackingMethod,
          verification_mode: finalVerificationMode,
        },
      }),
      { status: 201, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-challenge error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
