-- Create tts-cache storage bucket for ElevenLabs TTS audio caching.
-- Files are keyed by SHA-256(text + voice_id).mp3 and served from cache
-- to avoid redundant ElevenLabs API calls for repeated phrases.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tts-cache',
  'tts-cache',
  false,          -- not public; accessed via service role from the edge function
  5242880,        -- 5 MB max per file (generous for MP3 clips)
  ARRAY['audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow the service role (used by the edge function) full access.
-- No RLS policies needed since the edge function uses the service role key,
-- which bypasses RLS. Regular users never touch this bucket directly.
