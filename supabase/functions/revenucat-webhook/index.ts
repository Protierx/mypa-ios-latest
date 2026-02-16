// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * RevenueCat Webhook Edge Function
 *
 * Handles subscription lifecycle events from RevenueCat:
 * - INITIAL_PURCHASE / RENEWAL → is_premium = true
 * - CANCELLATION / EXPIRATION → is_premium = false
 *
 * Webhook URL: https://exztrtyvjipikqexpirr.supabase.co/functions/v1/revenucat-webhook
 * Configure in RevenueCat Dashboard → Project Settings → Webhooks
 *
 * Reference: PRD Section 3 (Monetisation), IMPLEMENTATION_PLAN 3.1
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-revenucat-webhook-auth-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// RevenueCat webhook event types we care about
const PREMIUM_GRANT_EVENTS = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE', // upgrade
];

const PREMIUM_REVOKE_EVENTS = [
  'CANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
];

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify webhook auth key (set in RevenueCat dashboard & Supabase secrets)
    const webhookAuthKey = Deno.env.get('REVENUCAT_WEBHOOK_AUTH_KEY');
    if (webhookAuthKey) {
      const authHeader = req.headers.get('x-revenucat-webhook-auth-key') ||
                         req.headers.get('authorization');
      if (authHeader !== webhookAuthKey && authHeader !== `Bearer ${webhookAuthKey}`) {
        console.error('[revenucat-webhook] Invalid auth key');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json();
    const event = body.event;

    if (!event) {
      return new Response(JSON.stringify({ error: 'Missing event' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const eventType: string = event.type;
    const appUserId: string | undefined = event.app_user_id;

    console.log(`[revenucat-webhook] Event: ${eventType}, User: ${appUserId}`);

    if (!appUserId) {
      console.warn('[revenucat-webhook] No app_user_id in event, skipping');
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let isPremium: boolean | null = null;

    if (PREMIUM_GRANT_EVENTS.includes(eventType)) {
      isPremium = true;
    } else if (PREMIUM_REVOKE_EVENTS.includes(eventType)) {
      isPremium = false;
    }

    if (isPremium !== null) {
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_premium: isPremium,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appUserId);

      if (updateError) {
        console.error(`[revenucat-webhook] Failed to update profile: ${updateError.message}`);
        return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[revenucat-webhook] Updated user ${appUserId} is_premium=${isPremium}`);
    }

    // Log the event regardless
    const { error: logError } = await supabase
      .from('event_log')
      .insert({
        user_id: appUserId,
        event_type: 'subscription_event',
        params: {
          revenucat_event: eventType,
          product_id: event.product_id || null,
          price_in_purchased_currency: event.price_in_purchased_currency || null,
          currency: event.currency || null,
          expiration_at: event.expiration_at_ms
            ? new Date(event.expiration_at_ms).toISOString()
            : null,
          is_premium: isPremium,
          environment: event.environment || 'PRODUCTION',
        },
      });

    if (logError) {
      console.warn(`[revenucat-webhook] Failed to log event: ${logError.message}`);
    }

    return new Response(JSON.stringify({ ok: true, event: eventType, is_premium: isPremium }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[revenucat-webhook] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
