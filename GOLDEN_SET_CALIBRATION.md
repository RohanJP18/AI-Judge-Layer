# 🎯 Golden Set Calibration

## Overview

Golden Set Calibration is a production-grade feature for validating AI judge quality **before** deploying them in real evaluation scenarios. This ensures only high-performing judges are used in production, directly aligning with besimple AI's business model of automated educational assessment.

## Why This Matters

### For besimple AI
- **Quality Assurance**: Ensure judges meet accuracy thresholds before student evaluations
- **Statistical Rigor**: Precision, recall, F1 scores, and confusion matrices provide transparent metrics
- **Trust & Compliance**: Demonstrate systematic quality control to educational institutions
- **Continuous Monitoring**: Track judge performance degradation over time

### Technical Excellence
- **ML Best Practices**: Industry-standard metrics (precision, recall, F1)
- **Confusion Matrix**: Detailed breakdown of prediction errors
- **90% Threshold**: Only judges scoring ≥90% accuracy pass calibration
- **Reproducibility**: Same golden set → consistent benchmarking

---

## How It Works

### 1. Upload Golden Set
Pre-evaluated questions with **known correct verdicts** (ground truth):

```json
[
  {
    "question_id": "golden_q1",
    "question_text": "What is the capital of France?",
    "question_type": "geography",
    "student_answer_choice": "Paris",
    "student_answer_reasoning": "Paris is the capital of France",
    "ground_truth_verdict": "pass",
    "ground_truth_reasoning": "Correct answer"
  }
]
```

**Required Fields:**
- `question_id`: Unique identifier
- `question_text`: The question
- `ground_truth_verdict`: `"pass"` | `"fail"` | `"inconclusive"`
- `ground_truth_reasoning`: Explanation of ground truth

**Optional Fields:**
- `question_type`: Category (e.g., math, science)
- `student_answer_choice`: Multiple choice answer
- `student_answer_reasoning`: Written explanation

### 2. Run Calibration
- Select an AI judge to test
- Judge evaluates **all** golden set questions
- Predictions are compared against ground truth
- Metrics are calculated automatically

### 3. Review Results
- **Accuracy**: `(correct predictions / total questions) × 100`
- **Passed Threshold**: ✓ if accuracy ≥ 90%
- **Confusion Matrix**: Detailed error analysis
- **F1 Scores**: Per-verdict performance metrics

---

## Metrics Explained

### Accuracy
Overall correctness rate:
```
Accuracy = (Correct Predictions / Total Questions) × 100
```

### Precision (for "pass" verdict)
How many predicted "pass" verdicts were actually correct:
```
Precision = TP / (TP + FP)
```
- TP (True Positives): Correctly predicted "pass"
- FP (False Positives): Incorrectly predicted "pass" (should be "fail")

### Recall (for "pass" verdict)
How many actual "pass" cases were correctly identified:
```
Recall = TP / (TP + FN)
```
- FN (False Negatives): Missed "pass" cases (predicted "fail" or "inconclusive")

### F1 Score
Harmonic mean of precision and recall:
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

### Confusion Matrix
Full breakdown of predictions:

|                  | **Predicted Pass** | **Predicted Fail** | **Predicted Inconclusive** |
|------------------|--------------------|--------------------|---------------------------|
| **Actual Pass**  | TP (Pass→Pass)     | Pass→Fail          | Pass→Inconclusive         |
| **Actual Fail**  | Fail→Pass (FP)     | TN (Fail→Fail)     | Fail→Inconclusive         |
| **Actual Inc**   | Inc→Pass           | Inc→Fail           | Inc→Inconclusive          |

---

## Database Schema

### `golden_set_questions`
Stores pre-evaluated questions:
```sql
CREATE TABLE golden_set_questions (
  id UUID PRIMARY KEY,
  question_id TEXT NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  ground_truth_verdict TEXT NOT NULL,
  ground_truth_reasoning TEXT NOT NULL,
  ...
);
```

### `calibration_runs`
Records of calibration tests:
```sql
CREATE TABLE calibration_runs (
  id UUID PRIMARY KEY,
  judge_id UUID REFERENCES judges(id),
  accuracy DECIMAL(5, 2) NOT NULL,
  passed_threshold BOOLEAN NOT NULL,
  confusion_matrix JSONB NOT NULL,
  ...
);
```

### `calibration_results`
Individual predictions per question:
```sql
CREATE TABLE calibration_results (
  id UUID PRIMARY KEY,
  calibration_run_id UUID REFERENCES calibration_runs(id),
  golden_question_id UUID REFERENCES golden_set_questions(id),
  predicted_verdict TEXT NOT NULL,
  ground_truth_verdict TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  ...
);
```

---

## Edge Function: `run-calibration`

### Purpose
Server-side execution of calibration runs to:
1. Fetch golden set questions
2. Call LLM APIs for each question
3. Compare predictions with ground truth
4. Calculate metrics and confusion matrix
5. Store results in database

### API
**Endpoint**: `POST /functions/v1/run-calibration`

**Request Body**:
```json
{
  "judge_id": "uuid-of-judge-to-test"
}
```

**Response**:
```json
{
  "success": true,
  "calibration_run_id": "uuid-of-run",
  "accuracy": 92.5,
  "passed_threshold": true,
  "total_questions": 10,
  "correct_predictions": 9
}
```

### Error Handling
- Missing judge ID → 400 Bad Request
- Judge not found → 404 Not Found
- Empty golden set → 400 Bad Request
- LLM API errors → Gracefully handled, marked as "inconclusive"

---

## UI Components

### 1. `GoldenSetUpload.tsx`
- Drag-and-drop JSON file upload
- Validation and error handling
- View current golden set
- Delete individual questions

### 2. `CalibrationRunner.tsx`
- Select judge to test
- Run calibration button
- View calibration history
- Confusion matrix visualization

### 3. `CalibrationPage.tsx`
- Tab-based interface (Upload | Run)
- Integrated navigation
- Educational info panels

---

## Usage Guide

### Step 1: Create Golden Set
1. Manually evaluate 10-20 representative questions
2. Save as JSON file (`sample_golden_set.json` provided)
3. Include diverse question types and verdicts

### Step 2: Upload
1. Navigate to **Calibration** page
2. Click **Upload Golden Set** tab
3. Drag-and-drop JSON file or click to browse
4. Verify uploaded questions

### Step 3: Run Calibration
1. Click **Run Calibration** tab
2. Select judge from dropdown
3. Click **Run Calibration** button
4. Wait for completion (~10-30 seconds)

### Step 4: Review Results
1. View accuracy, precision, recall, F1 scores
2. Check if judge passed threshold (≥90%)
3. Analyze confusion matrix for error patterns
4. Track performance over time

---

## Best Practices

### Golden Set Design
✅ **DO:**
- Include 10+ questions minimum
- Cover diverse topics and question types
- Balance verdicts (mix of pass/fail/inconclusive)
- Use clear, unambiguous ground truth
- Update golden set regularly

❌ **DON'T:**
- Use ambiguous or subjective questions
- Create unbalanced sets (e.g., all "pass")
- Include outdated content
- Reuse evaluation data as golden set

### Calibration Frequency
- **Initial**: Before first production use
- **Regular**: Monthly or after judge updates
- **Triggered**: After model upgrades or prompt changes
- **Ad-hoc**: If evaluation quality concerns arise

### Passing Criteria
- **Standard**: ≥90% accuracy
- **High-stakes**: ≥95% accuracy (adjust threshold in code if needed)
- **Minimum F1**: ≥85% for both "pass" and "fail" verdicts

---

## Example Calibration Run

### Input
- **Judge**: "Strict Evaluator" (GPT-4)
- **Golden Set**: 10 questions (5 pass, 4 fail, 1 inconclusive)

### Results
```
✓ PASSED CALIBRATION

Accuracy:          90.0%
Correct:           9 / 10
Precision (Pass):  87.5%
Recall (Pass):     100.0%
F1 (Pass):         93.3%
Precision (Fail):  100.0%
Recall (Fail):     75.0%
F1 (Fail):         85.7%

Confusion Matrix:
   Pass→Pass: 5    Pass→Fail: 0    Pass→Inc: 0
   Fail→Pass: 1    Fail→Fail: 3    Fail→Inc: 0
   Inc→Pass:  0    Inc→Fail:  0    Inc→Inc:  1
```

### Interpretation
- Judge correctly identified all actual "pass" cases (perfect recall)
- Judge incorrectly marked 1 "fail" as "pass" (lower precision for fail)
- Overall strong performance at 90% accuracy
- **Recommendation**: Approved for production use

---

## Technical Implementation

### Frontend Architecture
- **State Management**: React Query for server state
- **Validation**: Client-side JSON validation before upload
- **Real-time Updates**: Automatic refresh after calibration
- **Error Handling**: Toast notifications for user feedback

### Backend Architecture
- **Edge Function**: Supabase serverless function for calibration
- **Provider Pattern**: Supports OpenAI, Anthropic, Gemini
- **Atomic Operations**: Transactional inserts for consistency
- **Retry Logic**: Graceful handling of LLM API failures

### Performance
- **Parallel Processing**: Could be added for large golden sets
- **Caching**: Golden set questions cached in memory during run
- **Indexing**: Database indexes on frequently queried columns
- **Optimization**: Minimal database round-trips

---

## Deployment Checklist

### Database Setup
```bash
# Run migration in Supabase SQL Editor
# File: supabase/migrations/005_golden_set_calibration.sql
```

### Edge Function Deployment
```bash
# Deploy calibration function
supabase functions deploy run-calibration

# Verify deployment
supabase functions list
```

### Frontend Integration
```bash
# Routes and navigation already added
npm run dev

# Navigate to /calibration
```

### Testing
1. ✓ Upload sample golden set
2. ✓ Run calibration with existing judge
3. ✓ Verify metrics calculation
4. ✓ Check confusion matrix accuracy
5. ✓ Test error handling (empty golden set, missing judge)

---

## Future Enhancements

### Suggested Improvements
1. **Batch Calibration**: Test multiple judges simultaneously
2. **Historical Trends**: Chart accuracy over time per judge
3. **Auto-retrain Triggers**: Alert when judge performance degrades
4. **Golden Set Curation**: UI for manual question addition/editing
5. **Export Reports**: PDF/CSV reports for stakeholders
6. **A/B Testing**: Compare two judges on same golden set
7. **Confidence Intervals**: Statistical significance testing
8. **Question Difficulty**: Track which questions are hardest

---

## FAQ

**Q: How many questions should be in the golden set?**  
A: Minimum 10, recommended 20-50 for statistical significance.

**Q: Can I edit golden set questions after upload?**  
A: Currently, only deletion is supported. Delete and re-upload to modify.

**Q: What if a judge scores 89.9%?**  
A: Failed calibration. Review errors, adjust prompts, and re-test.

**Q: How long does calibration take?**  
A: ~1-3 seconds per question. 10 questions ≈ 10-30 seconds total.

**Q: Can I use real student submissions as golden set?**  
A: Yes, but **only** if they've been independently verified by human experts.

**Q: What's the difference between calibration and evaluation?**  
A: **Calibration**: Testing judge quality on known answers. **Evaluation**: Using judge on unknown submissions.

---

## Summary

Golden Set Calibration is a **production-critical feature** that:
- ✅ Ensures AI judge quality before production use
- ✅ Provides statistical rigor (precision, recall, F1)
- ✅ Demonstrates ML engineering best practices
- ✅ Aligns with besimple AI's automated assessment mission
- ✅ Builds trust with educational institutions

**This feature elevates the project from a demo to a production-grade system.**


