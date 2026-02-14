-- ============================================================================
-- 015: Brain Dump Items Table
-- Captures quick thoughts/tasks without scheduling info.
-- Items can be converted to scheduled tasks via "Move to Tasks".
-- ============================================================================

-- Create brain_dump_items table
CREATE TABLE IF NOT EXISTS public.brain_dump_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL CHECK (char_length(trim(text)) > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'converted', 'archived')),
  converted_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_brain_dump_items_user_id ON public.brain_dump_items(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_dump_items_status ON public.brain_dump_items(user_id, status);

-- Enable RLS
ALTER TABLE public.brain_dump_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own brain dump items
CREATE POLICY "Users can view own brain dump items"
  ON public.brain_dump_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brain dump items"
  ON public.brain_dump_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brain dump items"
  ON public.brain_dump_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brain dump items"
  ON public.brain_dump_items FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at function (if not already exists)
CREATE OR REPLACE FUNCTION public.set_brain_dump_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at trigger
CREATE TRIGGER set_brain_dump_items_updated_at
  BEFORE UPDATE ON public.brain_dump_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_brain_dump_updated_at();

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brain_dump_items TO authenticated;
