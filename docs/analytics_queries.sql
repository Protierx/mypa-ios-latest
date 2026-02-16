-- MYPA Analytics Queries — Baseline KPI Measurements
-- Reference: MYLO PLAN Step 12 (Analytics & KPIs)
-- Save in Supabase SQL Editor and run periodically.
--
-- Targets:
--   Voice success rate   ≥ 90%
--   P95 latency          < 800ms
--   User override rate   < 5%
--   Briefing listen rate > 60%
--
-- Generated: 16 February 2026

-- ============================================================================
-- 1. Voice Success Rate (target ≥ 90%)
-- ============================================================================
SELECT
  COALESCE(
    COUNT(*) FILTER (WHERE (params->>'success')::boolean = true)::float
    / NULLIF(COUNT(*), 0),
    0
  ) AS voice_success_rate,
  COUNT(*) AS total_voice_commands,
  COUNT(*) FILTER (WHERE (params->>'success')::boolean = true) AS successful
FROM event_log
WHERE event_type = 'voice_command'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- 2. P95 Latency (target < 800ms)
-- ============================================================================
SELECT
  COALESCE(
    percentile_cont(0.95) WITHIN GROUP (ORDER BY (params->>'latency_ms')::numeric),
    0
  ) AS p95_latency_ms,
  COALESCE(
    percentile_cont(0.50) WITHIN GROUP (ORDER BY (params->>'latency_ms')::numeric),
    0
  ) AS p50_latency_ms,
  COUNT(*) AS sample_size
FROM event_log
WHERE event_type = 'voice_command'
  AND params->>'latency_ms' IS NOT NULL
  AND (params->>'action') != 'unknown'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- 3. User Override Rate (target < 5%)
-- ============================================================================
SELECT
  COALESCE(
    COUNT(*) FILTER (WHERE (params->>'user_override')::boolean = true)::float
    / NULLIF(COUNT(*), 0),
    0
  ) AS override_rate,
  COUNT(*) FILTER (WHERE (params->>'user_override')::boolean = true) AS overridden,
  COUNT(*) AS total
FROM event_log
WHERE event_type = 'voice_command'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- 4. Daily Voice Commands Per User
-- ============================================================================
SELECT
  user_id,
  COUNT(*) AS daily_commands,
  created_at::date AS day
FROM event_log
WHERE event_type = 'voice_command'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id, created_at::date
ORDER BY day DESC, daily_commands DESC;

-- ============================================================================
-- 5. Briefing Listen-Through Rate (target > 60%)
-- ============================================================================
SELECT
  COALESCE(
    COUNT(*) FILTER (
      WHERE event_type = 'briefing_progress'
      AND (params->>'percent')::int >= 100
    )::float
    / NULLIF(
      COUNT(*) FILTER (WHERE event_type = 'briefing_started'),
      0
    ),
    0
  ) AS listen_through_rate,
  COUNT(*) FILTER (WHERE event_type = 'briefing_started') AS briefings_started,
  COUNT(*) FILTER (
    WHERE event_type = 'briefing_progress'
    AND (params->>'percent')::int >= 100
  ) AS briefings_completed
FROM event_log
WHERE event_type IN ('briefing_started', 'briefing_progress')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================================================
-- 6. Event Coverage (last 7 days) — general health check
-- ============================================================================
SELECT
  event_type,
  COUNT(*) AS count
FROM event_log
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;

-- ============================================================================
-- 7. Voice Feedback Quality (beta — "Was that right?" responses)
-- ============================================================================
SELECT
  COALESCE(
    COUNT(*) FILTER (WHERE (params->>'correct')::boolean = true)::float
    / NULLIF(COUNT(*), 0),
    0
  ) AS positive_rate,
  COUNT(*) AS total_feedback,
  COUNT(*) FILTER (WHERE (params->>'correct')::boolean = true) AS thumbs_up,
  COUNT(*) FILTER (WHERE (params->>'correct')::boolean = false) AS thumbs_down
FROM event_log
WHERE event_type = 'voice_feedback'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days';
