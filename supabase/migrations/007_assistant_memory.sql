-- Create assistant memory/preferences table
CREATE TABLE IF NOT EXISTS assistant_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  common_queries TEXT[] DEFAULT '{}',
  preferred_judges TEXT[] DEFAULT '{}',
  frequent_queues TEXT[] DEFAULT '{}',
  last_asked_about JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_assistant_memory_user_id ON assistant_memory(user_id);

-- Enable RLS
ALTER TABLE assistant_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own memory"
  ON assistant_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory"
  ON assistant_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory"
  ON assistant_memory FOR UPDATE
  USING (auth.uid() = user_id);

