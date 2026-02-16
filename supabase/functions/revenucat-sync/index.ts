// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * RevenueCat Subscription Sync Edge Function
 *
 * On-demand subscription status verification & sync.
 * Called by the client on app launch to ensure profiles.is_premium is accurate.
 *
 * Endpoints:
 *   POST /revenucat-sync  { action: 'verify' }   → verify + sync from RevenueCat API
 *   POST /revenucat-sync  { action: 'status' }    → return cached status from profiles
 *   POST /revenucat-sync  { action: 'restore' }   → trigger restore purchases flow
 *
 * Requires secret: REVENUCAT_API_KEY (v1 secret API key from RevenueCat dashboard)
 *
 * Reference: PRD Section 3 (Monetisation), IMPLEMENTATION_PLAN 3.1
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/config.ts';

const REVENUCAT_API_BASE = 'https://api.revenuecat.com/v1';
const PREMIUM_ENTITLEMENT = 'premium'; // Must match RevenueCat dashboard

Deno.serve(async (req: Request) => {
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
    // ── Auth: get user from JWT ──────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const action = body.action || 'verify';

    // Admin client for profile updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── Action: status (cached) ─────────────────────────────────
    if (action === 'status') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_premium, premium_expires_at, subscription_product_id')
        .eq('id', user.id)
        .single();

      return new Response(JSON.stringify({
        is_premium: profile?.is_premium ?? false,
        expires_at: profile?.premium_expires_at ?? null,
        product_id: profile?.subscription_product_id ?? null,
        source: 'cache',
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Action: verify / restore → call RevenueCat API ──────────
    const revenuecatApiKey = Deno.env.get('REVENUCAT_API_KEY');
    if (!revenuecatApiKey) {
      console.error('[revenucat-sync] REVENUCAT_API_KEY not set');
      // Fall back to cached status
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      return new Response(JSON.stringify({
        is_premium: profile?.is_premium ?? false,
        source: 'cache_fallback',
        warning: 'RevenueCat API key not configured',
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Fetch subscriber info from RevenueCat
    const subscriberResponse = await fetch(
      `${REVENUCAT_API_BASE}/subscribers/${user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${revenuecatApiKey}`,
          'Content-Type': 'application/json',
          'X-Platform': 'ios',
        },
      },
    );

    if (!subscriberResponse.ok) {
      const errText = await subscriberResponse.text();
      console.error(`[revenucat-sync] RevenueCat API error: ${subscriberResponse.status} ${errText}`);

      // If 404 = subscriber doesn't exist → not premium
      if (subscriberResponse.status === 404) {
        await supabaseAdmin
          .from('profiles')
          .update({ is_premium: false, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        return new Response(JSON.stringify({
          is_premium: false,
          source: 'revenucat',
          detail: 'No subscriber record found',
        }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Failed to verify subscription' }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const subscriberData = await subscriberResponse.json();
    const subscriber = subscriberData.subscriber;

    // Check entitlements
    const entitlements = subscriber?.entitlements || {};
    const premiumEntitlement = entitlements[PREMIUM_ENTITLEMENT];

    let isPremium = false;
    let expiresAt: string | null = null;
    let productId: string | null = null;

    if (premiumEntitlement) {
      expiresAt = premiumEntitlement.expires_date || null;
      productId = premiumEntitlement.product_identifier || null;

      // Check if still active
      if (expiresAt) {
        isPremium = new Date(expiresAt) > new Date();
      } else {
        // Lifetime / non-expiring
        isPremium = true;
      }
    }

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_premium: isPremium,
        premium_expires_at: expiresAt,
        subscription_product_id: productId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`[revenucat-sync] Profile update error: ${updateError.message}`);
    }

    // Log subscription history
    const activeSubscriptions = subscriber?.subscriptions || {};
    for (const [subProductId, sub] of Object.entries(activeSubscriptions)) {
      const subData = sub as any;
      await supabaseAdmin
        .from('subscription_history')
        .upsert({
          user_id: user.id,
          product_id: subProductId,
          entitlement: PREMIUM_ENTITLEMENT,
          status: isPremium ? 'active' : (subData.unsubscribe_detected_at ? 'cancelled' : 'expired'),
          started_at: subData.purchase_date || null,
          expires_at: subData.expires_date || null,
          cancelled_at: subData.unsubscribe_detected_at || null,
          price_usd: subData.price_in_purchased_currency || null,
          currency: subData.currency || null,
          store: subData.store === 'app_store' ? 'app_store' : subData.store === 'play_store' ? 'play_store' : 'app_store',
          environment: subData.environment || 'PRODUCTION',
          raw_data: subData,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });
    }

    // Log the sync event
    await supabaseAdmin.from('event_log').insert({
      user_id: user.id,
      event_type: 'subscription_sync',
      params: {
        action,
        is_premium: isPremium,
        product_id: productId,
        expires_at: expiresAt,
        source: 'revenucat_api',
      },
    });

    return new Response(JSON.stringify({
      is_premium: isPremium,
      expires_at: expiresAt,
      product_id: productId,
      source: 'revenucat',
      entitlements: Object.keys(entitlements),
      active_subscriptions: Object.keys(activeSubscriptions),
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[revenucat-sync] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
