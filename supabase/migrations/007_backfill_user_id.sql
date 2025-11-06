-- ============================================================================
-- MIGRATION 007: Backfill user_id for existing data
-- ============================================================================
-- This migration backfills user_id for data created before authentication.
-- IMPORTANT: This assigns ALL NULL user_id data to the currently authenticated user.
-- If you have multiple users, you'll need to manually assign data to the correct users.
-- ============================================================================

-- First, let's see what we're working with
-- This is a diagnostic query (won't modify data)
-- SELECT COUNT(*) as null_submissions FROM submissions WHERE user_id IS NULL;
-- SELECT COUNT(*) as null_evaluations FROM evaluations WHERE user_id IS NULL;

-- Step 1: Backfill submissions user_id
-- WARNING: This assigns ALL NULL submissions to the user who runs this script
-- You should run this while authenticated as the user who should own the data
UPDATE submissions
SET user_id = auth.uid()
WHERE user_id IS NULL
AND auth.uid() IS NOT NULL;

-- Step 2: Backfill evaluations user_id from their submission's user_id
UPDATE evaluations
SET user_id = (
  SELECT submissions.user_id
  FROM questions
  JOIN submissions ON submissions.id = questions.submission_id
  WHERE questions.id = evaluations.question_id
  LIMIT 1
)
WHERE user_id IS NULL
AND EXISTS (
  SELECT 1 FROM questions
  JOIN submissions ON submissions.id = questions.submission_id
  WHERE questions.id = evaluations.question_id
  AND submissions.user_id IS NOT NULL
);

-- Step 3: Backfill judges user_id (if any exist)
-- WARNING: This assigns ALL NULL judges to the current user
UPDATE judges
SET user_id = auth.uid()
WHERE user_id IS NULL
AND auth.uid() IS NOT NULL;

-- Step 4: Backfill judge_assignments user_id from their judge's user_id
UPDATE judge_assignments
SET user_id = (
  SELECT judges.user_id
  FROM judges
  WHERE judges.id = judge_assignments.judge_id
  LIMIT 1
)
WHERE user_id IS NULL
AND EXISTS (
  SELECT 1 FROM judges
  WHERE judges.id = judge_assignments.judge_id
  AND judges.user_id IS NOT NULL
);

-- Step 5: Backfill attachments user_id from their submission's user_id
UPDATE attachments
SET user_id = (
  SELECT submissions.user_id
  FROM submissions
  WHERE submissions.id = attachments.submission_id
  LIMIT 1
)
WHERE user_id IS NULL
AND EXISTS (
  SELECT 1 FROM submissions
  WHERE submissions.id = attachments.submission_id
  AND submissions.user_id IS NOT NULL
);

-- Step 6: Backfill golden_set_questions user_id
-- WARNING: This assigns ALL NULL golden questions to the current user
UPDATE golden_set_questions
SET user_id = auth.uid()
WHERE user_id IS NULL
AND auth.uid() IS NOT NULL;

-- Step 7: Backfill calibration_runs user_id from their judge's user_id
UPDATE calibration_runs
SET user_id = (
  SELECT judges.user_id
  FROM judges
  WHERE judges.id = calibration_runs.judge_id
  LIMIT 1
)
WHERE user_id IS NULL
AND EXISTS (
  SELECT 1 FROM judges
  WHERE judges.id = calibration_runs.judge_id
  AND judges.user_id IS NOT NULL
);

-- After running this migration, you should see your evaluations!
-- Verify with:
-- SELECT COUNT(*) FROM evaluations WHERE user_id IS NOT NULL;
-- SELECT COUNT(*) FROM evaluations WHERE user_id = auth.uid();
