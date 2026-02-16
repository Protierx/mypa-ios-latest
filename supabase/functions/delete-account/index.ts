// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Delete Account Edge Function
 *
 * Permanently deletes a user's account and all associated data.
 * Uses SERVICE_ROLE_KEY for admin operations.
 *
 * Apple App Store Requirement: Apps must provide functional account deletion.
 *
 * Cascade order:
 * 1. event_log
 * 2. focus_sessions
 * 3. brain_dump_items
 * 4. conversation_history
 * 5. notifications / push_tokens
 * 6. challenge_participants / challenge_progress
 * 7. circle_members
 * 8. tasks
 * 9. unlocks
 * 10. user_model
 * 11. user_gamification_state
 * 12. daily_user_stats
 * 13. profiles
 * 14. auth.users (admin deleteUser)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Create user-scoped client to verify identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;
    console.log(`[delete-account] Deleting account for user ${userId}`);

    // Admin client with SERVICE_ROLE_KEY for cascade deletion
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Cascade delete all user data ─────────────────────────────

    // 1. Event log
    await supabaseAdmin.from('event_log').delete().eq('user_id', userId);

    // 2. Focus sessions
    await supabaseAdmin.from('focus_sessions').delete().eq('user_id', userId);

    // 3. Brain dump items
    await supabaseAdmin.from('brain_dump_items').delete().eq('user_id', userId);

    // 4. Conversation history
    await supabaseAdmin.from('conversation_history').delete().eq('user_id', userId);

    // 5. Notifications & push tokens
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    await supabaseAdmin.from('push_tokens').delete().eq('user_id', userId);

    // 6. Challenge participants & progress
    await supabaseAdmin.from('challenge_progress').delete().eq('user_id', userId);
    await supabaseAdmin.from('challenge_participants').delete().eq('user_id', userId);

    // 7. Circle members
    await supabaseAdmin.from('circle_members').delete().eq('user_id', userId);

    // 8. Tasks
    await supabaseAdmin.from('tasks').delete().eq('user_id', userId);

    // 9. Unlocks
    await supabaseAdmin.from('unlocks').delete().eq('user_id', userId);

    // 10. User model
    await supabaseAdmin.from('user_model').delete().eq('user_id', userId);

    // 11. Gamification state
    await supabaseAdmin.from('user_gamification_state').delete().eq('user_id', userId);

    // 12. Daily user stats
    await supabaseAdmin.from('daily_user_stats').delete().eq('user_id', userId);

    // 13. Profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 14. Delete auth user (admin)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error(`[delete-account] Failed to delete auth user: ${deleteUserError.message}`);
      return new Response(
        JSON.stringify({ error: 'Failed to delete auth user', details: deleteUserError.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[delete-account] Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[delete-account] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
