// @ts-nocheck — Deno edge function; not type-checked by Node/TS
/**
 * Shared Rate Limiting Middleware
 *
 * Provides reusable rate-limit checking for edge functions.
 * Uses the check_rate_limit RPC for atomic counter increments.
 *
 * Usage:
 *   import { checkRateLimit, RATE_LIMITS } from '../_shared/rateLimit.ts';
 *   const result = await checkRateLimit(supabase, userId, 'voice_command', isPremium);
 *   if (!result.allowed) return rateLimitResponse(result);
 *
 * Reference: PRD Section 3 (Free Tier Limits), IMPLEMENTATION_PLAN §1.4
 */

import { CORS_HEADERS } from './config.ts';

// ============================================================================
// Rate Limit Definitions (PRD Section 3 — Free Tier Limits)
// ============================================================================

export const RATE_LIMITS = {
  voice_command: { free: 10, premium: 999999, window: 'daily' as const },
  brain_dump:    { free: 3,  premium: 999999, window: 'daily' as const },
  ai_chat:      { free: 20, premium: 999999, window: 'daily' as const },
  data_export:  { free: 1,  premium: 5,      window: 'daily' as const },
  calendar_sync:{ free: 5,  premium: 100,    window: 'hourly' as const },
  api_request:  { free: 100,premium: 10000,  window: 'hourly' as const },
} as const;

export type RateLimitResource = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resets_at: string;
  resource: string;
}

/**
 * Check & increment the rate limit for a user/resource.
 * Returns { allowed, current, limit, remaining, resets_at }.
 */
export async function checkRateLimit(
  supabase: any,
  userId: string,
  resource: RateLimitResource,
  isPremium: boolean,
  timezone = 'UTC',
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[resource];
  const maxAllowed = isPremium ? config.premium : config.free;

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_resource: resource,
    p_window_type: config.window,
    p_max_allowed: maxAllowed,
    p_timezone: timezone,
  });

  if (error) {
    console.error(`[rate-limit] RPC error for ${resource}:`, error.message);
    // Fail open — don't block the user on rate-limit infra failure
    return {
      allowed: true,
      current: 0,
      limit: maxAllowed,
      remaining: maxAllowed,
      resets_at: new Date(Date.now() + 86400000).toISOString(),
      resource,
    };
  }

  return { ...data, resource };
}

/**
 * Read-only rate limit status (doesn't increment the counter).
 */
export async function getRateLimitStatus(
  supabase: any,
  userId: string,
  resource: RateLimitResource,
  isPremium: boolean,
  timezone = 'UTC',
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[resource];
  const maxAllowed = isPremium ? config.premium : config.free;

  const { data, error } = await supabase.rpc('get_rate_limit_status', {
    p_user_id: userId,
    p_resource: resource,
    p_window_type: config.window,
    p_max_allowed: maxAllowed,
    p_timezone: timezone,
  });

  if (error) {
    console.error(`[rate-limit] Status RPC error for ${resource}:`, error.message);
    return {
      allowed: true,
      current: 0,
      limit: maxAllowed,
      remaining: maxAllowed,
      resets_at: new Date(Date.now() + 86400000).toISOString(),
      resource,
    };
  }

  return { ...data, resource };
}

/**
 * Standard 429 response with rate limit info.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      resource: result.resource,
      current: result.current,
      limit: result.limit,
      remaining: 0,
      resets_at: result.resets_at,
      upgrade_cta: 'Upgrade to Premium for higher limits',
    }),
    {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resets_at,
        'Retry-After': '60',
      },
    },
  );
}

/**
 * Helper to get user profile with premium status for rate limiting.
 */
export async function getUserWithPremiumStatus(
  supabase: any,
  userId: string,
): Promise<{ isPremium: boolean; timezone: string }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, timezone')
    .eq('id', userId)
    .single();

  return {
    isPremium: profile?.is_premium ?? false,
    timezone: profile?.timezone ?? 'UTC',
  };
}
