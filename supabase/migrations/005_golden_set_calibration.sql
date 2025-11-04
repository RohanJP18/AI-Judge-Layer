-- Golden Set for Judge Calibration
-- Pre-evaluated questions with known correct verdicts for testing judge accuracy

-- Golden set questions table
CREATE TABLE IF NOT EXISTS golden_set_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  student_answer_choice TEXT,
  student_answer_reasoning TEXT,
  ground_truth_verdict TEXT NOT NULL CHECK (ground_truth_verdict IN ('pass', 'fail', 'inconclusive')),
  ground_truth_reasoning TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  CONSTRAINT unique_golden_question UNIQUE(question_id)
);

-- Calibration runs table - tracks when judges are tested against golden set
CREATE TABLE IF NOT EXISTS calibration_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  judge_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_questions INTEGER NOT NULL,
  correct_predictions INTEGER NOT NULL,
  accuracy DECIMAL(5, 2) NOT NULL,
  precision_pass DECIMAL(5, 2),
  recall_pass DECIMAL(5, 2),
  f1_pass DECIMAL(5, 2),
  precision_fail DECIMAL(5, 2),
  recall_fail DECIMAL(5, 2),
  f1_fail DECIMAL(5, 2),
  confusion_matrix JSONB NOT NULL,
  passed_threshold BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT
);

-- Calibration results - individual predictions for each golden question
CREATE TABLE IF NOT EXISTS calibration_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calibration_run_id UUID NOT NULL REFERENCES calibration_runs(id) ON DELETE CASCADE,
  golden_question_id UUID NOT NULL REFERENCES golden_set_questions(id) ON DELETE CASCADE,
  predicted_verdict TEXT NOT NULL CHECK (predicted_verdict IN ('pass', 'fail', 'inconclusive')),
  predicted_reasoning TEXT NOT NULL,
  ground_truth_verdict TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_golden_questions_question_id ON golden_set_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_calibration_runs_judge ON calibration_runs(judge_id);
CREATE INDEX IF NOT EXISTS idx_calibration_results_run ON calibration_results(calibration_run_id);
CREATE INDEX IF NOT EXISTS idx_calibration_results_golden ON calibration_results(golden_question_id);

-- RLS Policies
ALTER TABLE golden_set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON golden_set_questions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON golden_set_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON golden_set_questions
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON calibration_runs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON calibration_runs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON calibration_results
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON calibration_results
  FOR INSERT WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE golden_set_questions IS 'Pre-evaluated questions with known correct verdicts for judge calibration';
COMMENT ON TABLE calibration_runs IS 'Records of judge calibration tests against golden set';
COMMENT ON TABLE calibration_results IS 'Individual predictions for each question in a calibration run';
COMMENT ON COLUMN calibration_runs.accuracy IS 'Overall accuracy: (correct predictions / total questions) * 100';
COMMENT ON COLUMN calibration_runs.precision_pass IS 'Precision for "pass" verdict: TP / (TP + FP)';
COMMENT ON COLUMN calibration_runs.recall_pass IS 'Recall for "pass" verdict: TP / (TP + FN)';
COMMENT ON COLUMN calibration_runs.f1_pass IS 'F1 score for "pass" verdict: 2 * (precision * recall) / (precision + recall)';
COMMENT ON COLUMN calibration_runs.confusion_matrix IS 'JSON object containing full confusion matrix';
COMMENT ON COLUMN calibration_runs.passed_threshold IS 'Whether judge passed calibration (typically >= 90% accuracy)';


