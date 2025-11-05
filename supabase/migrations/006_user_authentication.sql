-- Add user_id column to all main tables
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE judge_assignments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE golden_set_questions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE calibration_runs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user_id columns
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_judges_user_id ON judges(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_assignments_user_id ON judge_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_golden_set_questions_user_id ON golden_set_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_calibration_runs_user_id ON calibration_runs(user_id);

-- Drop existing RLS policies (they were too permissive)
DROP POLICY IF EXISTS "Allow all operations" ON submissions;
DROP POLICY IF EXISTS "Allow all operations" ON questions;
DROP POLICY IF EXISTS "Allow all operations" ON judges;
DROP POLICY IF EXISTS "Allow all operations" ON judge_assignments;
DROP POLICY IF EXISTS "Allow all operations" ON evaluations;
DROP POLICY IF EXISTS "Allow all operations" ON attachments;
DROP POLICY IF EXISTS "Allow all operations" ON golden_set_questions;
DROP POLICY IF EXISTS "Allow all operations" ON calibration_runs;
DROP POLICY IF EXISTS "Allow all operations" ON calibration_results;

-- Enable RLS on all tables
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_results ENABLE ROW LEVEL SECURITY;

-- Create function to get current user ID
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'sub')::UUID;
$$ LANGUAGE sql STABLE;

-- RLS Policies for submissions
CREATE POLICY "Users can view their own submissions"
  ON submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions"
  ON submissions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for questions (based on submission user_id)
CREATE POLICY "Users can view questions for their submissions"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = questions.submission_id
      AND submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions for their submissions"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = questions.submission_id
      AND submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions for their submissions"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = questions.submission_id
      AND submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions for their submissions"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = questions.submission_id
      AND submissions.user_id = auth.uid()
    )
  );

-- RLS Policies for judges
CREATE POLICY "Users can view their own judges"
  ON judges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own judges"
  ON judges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own judges"
  ON judges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own judges"
  ON judges FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for judge_assignments
CREATE POLICY "Users can view their own judge assignments"
  ON judge_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own judge assignments"
  ON judge_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own judge assignments"
  ON judge_assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own judge assignments"
  ON judge_assignments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for evaluations (based on question's submission user_id)
CREATE POLICY "Users can view evaluations for their submissions"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN submissions ON submissions.id = questions.submission_id
      WHERE questions.id = evaluations.question_id
      AND submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert evaluations for their submissions"
  ON evaluations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM questions
      JOIN submissions ON submissions.id = questions.submission_id
      WHERE questions.id = evaluations.question_id
      AND submissions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update evaluations for their submissions"
  ON evaluations FOR UPDATE
  USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM questions
      JOIN submissions ON submissions.id = questions.submission_id
      WHERE questions.id = evaluations.question_id
      AND submissions.user_id = auth.uid()
    )
  );

-- RLS Policies for attachments
CREATE POLICY "Users can view their own attachments"
  ON attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
  ON attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
  ON attachments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for golden_set_questions
CREATE POLICY "Users can view their own golden set questions"
  ON golden_set_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own golden set questions"
  ON golden_set_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own golden set questions"
  ON golden_set_questions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own golden set questions"
  ON golden_set_questions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for calibration_runs
CREATE POLICY "Users can view their own calibration runs"
  ON calibration_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calibration runs"
  ON calibration_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calibration runs"
  ON calibration_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for calibration_results (based on calibration_run user_id)
CREATE POLICY "Users can view their own calibration results"
  ON calibration_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calibration_runs
      WHERE calibration_runs.id = calibration_results.calibration_run_id
      AND calibration_runs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own calibration results"
  ON calibration_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calibration_runs
      WHERE calibration_runs.id = calibration_results.calibration_run_id
      AND calibration_runs.user_id = auth.uid()
    )
  );
