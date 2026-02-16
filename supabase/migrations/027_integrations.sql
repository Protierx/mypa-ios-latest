-- =====================================================
-- 027: Integration APIs — Supporting Tables
-- Adds rate_limits, integration_connections, data_exports
-- =====================================================

-- =====================================================
-- RATE LIMITS TABLE — per-user daily/hourly counters
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resource TEXT NOT NULL,                -- e.g. 'voice_command', 'brain_dump', 'ai_chat'
  window_start TIMESTAMPTZ NOT NULL,     -- start of the rate-limit window
  window_type TEXT NOT NULL DEFAULT 'daily' CHECK (window_type IN ('hourly', 'daily', 'monthly')),
  count INTEGER DEFAULT 0,
  max_allowed INTEGER NOT NULL,          -- limit for this window
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, resource, window_start, window_type)
);

CREATE INDEX IF NOT EXISTS rate_limits_user_resource_idx
  ON public.rate_limits (user_id, resource, window_start);

-- =====================================================
-- INTEGRATION CONNECTIONS — tracks 3rd-party accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN (
    'apple_calendar', 'google_calendar', 'outlook_calendar',
    'revenucat', 'apple_health', 'google_fit',
    'slack', 'notion', 'todoist'
  )),
  external_id TEXT,                      -- provider's user/account ID
  access_token TEXT,                     -- encrypted at rest by Supabase
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],                         -- granted OAuth scopes
  metadata JSONB DEFAULT '{}',           -- provider-specific config
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS integration_connections_user_idx
  ON public.integration_connections (user_id, provider);

-- =====================================================
-- DATA EXPORTS — tracks user data export requests
-- =====================================================
CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  format TEXT DEFAULT 'json' CHECK (format IN ('json', 'csv')),
  file_path TEXT,                        -- Supabase Storage path when completed
  file_size_bytes BIGINT,
  sections TEXT[] DEFAULT ARRAY['profile', 'tasks', 'focus_sessions', 'events', 'circles', 'challenges'],
  error_message TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  download_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS data_exports_user_idx
  ON public.data_exports (user_id, status);

-- =====================================================
-- SUBSCRIPTION HISTORY — detailed RevenueCat sync log
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT,
  entitlement TEXT DEFAULT 'premium',
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'billing_issue', 'grace_period', 'trial')),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  price_usd NUMERIC(10, 2),
  currency TEXT,
  store TEXT CHECK (store IN ('app_store', 'play_store', 'stripe', 'promotional')),
  environment TEXT DEFAULT 'PRODUCTION',
  raw_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_history_user_idx
  ON public.subscription_history (user_id, status);

-- =====================================================
-- Add is_premium and subscription fields to profiles if missing
-- =====================================================
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_product_id TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =====================================================
-- RPC: Increment rate limit counter (atomic upsert)
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_resource TEXT,
  p_window_type TEXT DEFAULT 'daily',
  p_max_allowed INTEGER DEFAULT 10,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Compute window start based on type
  IF p_window_type = 'hourly' THEN
    v_window_start := date_trunc('hour', NOW() AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  ELSIF p_window_type = 'daily' THEN
    v_window_start := date_trunc('day', NOW() AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  ELSIF p_window_type = 'monthly' THEN
    v_window_start := date_trunc('month', NOW() AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  END IF;

  -- Atomic upsert + increment
  INSERT INTO public.rate_limits (user_id, resource, window_start, window_type, count, max_allowed)
  VALUES (p_user_id, p_resource, v_window_start, p_window_type, 1, p_max_allowed)
  ON CONFLICT (user_id, resource, window_start, window_type)
  DO UPDATE SET
    count = rate_limits.count + 1,
    updated_at = NOW()
  RETURNING count INTO v_current_count;

  v_allowed := v_current_count <= p_max_allowed;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current', v_current_count,
    'limit', p_max_allowed,
    'remaining', GREATEST(p_max_allowed - v_current_count, 0),
    'resets_at', v_window_start + CASE p_window_type
      WHEN 'hourly' THEN INTERVAL '1 hour'
      WHEN 'daily' THEN INTERVAL '1 day'
      WHEN 'monthly' THEN INTERVAL '1 month'
    END
  );
END;
$$;

-- =====================================================
-- RPC: Get rate limit status (read-only, no increment)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  p_user_id UUID,
  p_resource TEXT,
  p_window_type TEXT DEFAULT 'daily',
  p_max_allowed INTEGER DEFAULT 10,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  IF p_window_type = 'hourly' THEN
    v_window_start := date_trunc('hour', NOW() AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  ELSIF p_window_type = 'daily' THEN
    v_window_start := date_trunc('day', NOW() AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  ELSIF p_window_type = 'monthly' THEN
    v_window_start := date_trunc('month', NOW() AT TIME ZONE p_timezone) AT TIME ZONE p_timezone;
  END IF;

  SELECT count INTO v_current_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND resource = p_resource
    AND window_start = v_window_start
    AND window_type = p_window_type;

  v_current_count := COALESCE(v_current_count, 0);

  RETURN jsonb_build_object(
    'allowed', v_current_count < p_max_allowed,
    'current', v_current_count,
    'limit', p_max_allowed,
    'remaining', GREATEST(p_max_allowed - v_current_count, 0),
    'resets_at', v_window_start + CASE p_window_type
      WHEN 'hourly' THEN INTERVAL '1 hour'
      WHEN 'daily' THEN INTERVAL '1 day'
      WHEN 'monthly' THEN INTERVAL '1 month'
    END
  );
END;
$$;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Rate limits: users can read their own
CREATE POLICY "Users can view own rate limits"
  ON public.rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Integration connections: users can manage their own
CREATE POLICY "Users can view own integrations"
  ON public.integration_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
  ON public.integration_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON public.integration_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON public.integration_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Data exports: users can view their own
CREATE POLICY "Users can view own exports"
  ON public.data_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request exports"
  ON public.data_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Subscription history: users can view their own
CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON public.rate_limits TO authenticated;
GRANT ALL ON public.integration_connections TO authenticated;
GRANT ALL ON public.data_exports TO authenticated;
GRANT ALL ON public.subscription_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status TO authenticated;

-- Service role needs full access for edge functions
GRANT ALL ON public.rate_limits TO service_role;
GRANT ALL ON public.integration_connections TO service_role;
GRANT ALL ON public.data_exports TO service_role;
GRANT ALL ON public.subscription_history TO service_role;
