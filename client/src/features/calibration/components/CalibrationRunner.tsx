import { useState } from 'react'
import { Play, AlertCircle, CheckCircle2, TrendingUp, Target, ChevronDown, ChevronUp, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/Select'
import { useJudges } from '@/features/judges/hooks/useJudges'
import { useRunCalibration, useCalibrationRuns, useCalibrationResults } from '../hooks/useCalibration'

export function CalibrationRunner() {
  const [selectedJudge, setSelectedJudge] = useState<string>('')
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  const { data: judges } = useJudges()
  const { data: calibrationRuns, isLoading: runsLoading } = useCalibrationRuns()
  const runCalibrationMutation = useRunCalibration()

  const handleRunCalibration = () => {
    if (!selectedJudge) return
    runCalibrationMutation.mutate(selectedJudge)
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Run Calibration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Run Calibration</CardTitle>
          <CardDescription>
            Test a judge's accuracy against the golden set
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Judge</label>
              <Select value={selectedJudge} onValueChange={setSelectedJudge}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a judge to calibrate" />
                </SelectTrigger>
                <SelectContent>
                  {judges?.map((judge) => (
                    <SelectItem key={judge.id} value={judge.id}>
                      {judge.name} ({judge.model_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRunCalibration}
              disabled={!selectedJudge || runCalibrationMutation.isPending}
              className="min-w-[140px]"
            >
              {runCalibrationMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Calibration
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">How Calibration Works</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>Judge evaluates all golden set questions</li>
                  <li>Predictions are compared against ground truth</li>
                  <li>Accuracy, precision, recall, and F1 scores are calculated</li>
                  <li>Judge must score ≥90% to pass calibration</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calibration History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calibration History</CardTitle>
              <CardDescription>
                Past calibration runs and results
              </CardDescription>
            </div>
            {calibrationRuns && calibrationRuns.length > 0 && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                {calibrationRuns.length} run(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : calibrationRuns && calibrationRuns.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {calibrationRuns.map((run) => (
                <div key={run.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{run.judge_name}</h4>
                        <Badge variant="outline" className="text-xs">{run.model_name}</Badge>
                        {run.passed_threshold ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Passed
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formatDate(run.created_at)}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Accuracy</p>
                          <p className={`font-bold text-lg ${getAccuracyColor(run.accuracy)}`}>
                            {run.accuracy.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Correct</p>
                          <p className="font-semibold">
                            {run.correct_predictions} / {run.total_questions}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">F1 (Pass)</p>
                          <p className="font-semibold">
                            {run.f1_pass ? run.f1_pass.toFixed(1) + '%' : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">F1 (Fail)</p>
                          <p className="font-semibold">
                            {run.f1_fail ? run.f1_fail.toFixed(1) + '%' : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Confusion Matrix Preview */}
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                        <p className="text-xs font-medium mb-2">Confusion Matrix</p>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="text-center p-2 bg-green-100 dark:bg-green-900 rounded">
                            <p className="font-mono">{run.confusion_matrix.pass_as_pass}</p>
                            <p className="text-[10px] text-muted-foreground">Pass→Pass</p>
                          </div>
                          <div className="text-center p-2 bg-red-100 dark:bg-red-900 rounded">
                            <p className="font-mono">{run.confusion_matrix.pass_as_fail}</p>
                            <p className="text-[10px] text-muted-foreground">Pass→Fail</p>
                          </div>
                          <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                            <p className="font-mono">{run.confusion_matrix.pass_as_inconclusive}</p>
                            <p className="text-[10px] text-muted-foreground">Pass→Inc</p>
                          </div>
                          <div className="text-center p-2 bg-red-100 dark:bg-red-900 rounded">
                            <p className="font-mono">{run.confusion_matrix.fail_as_pass}</p>
                            <p className="text-[10px] text-muted-foreground">Fail→Pass</p>
                          </div>
                          <div className="text-center p-2 bg-green-100 dark:bg-green-900 rounded">
                            <p className="font-mono">{run.confusion_matrix.fail_as_fail}</p>
                            <p className="text-[10px] text-muted-foreground">Fail→Fail</p>
                          </div>
                          <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                            <p className="font-mono">{run.confusion_matrix.fail_as_inconclusive}</p>
                            <p className="text-[10px] text-muted-foreground">Fail→Inc</p>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Question Details */}
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                          className="w-full"
                        >
                          {expandedRunId === run.id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Hide Question Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Show Question Details
                            </>
                          )}
                        </Button>
                        {expandedRunId === run.id && (
                          <QuestionResults runId={run.id} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No calibration runs yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Run a calibration to see results here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Component to display individual question results
function QuestionResults({ runId }: { runId: string }) {
  const { data: results, isLoading } = useCalibrationResults(runId)

  if (isLoading) {
    return (
      <div className="mt-3 p-4 text-center text-sm text-muted-foreground">
        Loading question results...
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <div className="mt-3 p-4 text-center text-sm text-muted-foreground">
        No question results available
      </div>
    )
  }

  const failedQuestions = results.filter((r) => !r.is_correct)
  const passedQuestions = results.filter((r) => r.is_correct)

  return (
    <div className="mt-3 space-y-3">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="font-medium">{passedQuestions.length} Correct</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="font-medium">{failedQuestions.length} Incorrect</span>
        </div>
      </div>

      {/* Show failed questions first */}
      {failedQuestions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-red-600 dark:text-red-400">
            ❌ Failed Questions ({failedQuestions.length})
          </h5>
          {failedQuestions.map((result) => (
            <QuestionResultItem key={result.id} result={result} />
          ))}
        </div>
      )}

      {/* Show passed questions */}
      {passedQuestions.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-semibold text-green-600 dark:text-green-400">
            ✅ Correct Questions ({passedQuestions.length})
          </h5>
          {passedQuestions.map((result) => (
            <QuestionResultItem key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  )
}

// Component to display a single question result
function QuestionResultItem({ result }: { result: any }) {
  const question = result.golden_question
  const isCorrect = result.is_correct

  const getVerdictBadgeColor = (verdict: string) => {
    switch (verdict) {
      case 'pass':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'fail':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'inconclusive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div
      className={`p-3 border rounded-lg ${
        isCorrect
          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">{question.question_text}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge variant="outline" className="text-xs">
              {question.question_type}
            </Badge>
            <span>ID: {question.question_id}</span>
          </div>
        </div>
        {isCorrect ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground mb-1">Expected:</p>
          <Badge className={getVerdictBadgeColor(result.ground_truth_verdict)}>
            {result.ground_truth_verdict}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Predicted:</p>
          <Badge className={getVerdictBadgeColor(result.predicted_verdict)}>
            {result.predicted_verdict}
          </Badge>
        </div>
      </div>

      {question.student_answer_choice || question.student_answer_reasoning ? (
        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded text-xs">
          <p className="font-medium mb-1">Student Answer:</p>
          {question.student_answer_choice && (
            <p className="mb-1">
              <span className="font-medium">Choice:</span> {question.student_answer_choice}
            </p>
          )}
          {question.student_answer_reasoning && (
            <p>
              <span className="font-medium">Reasoning:</span> {question.student_answer_reasoning}
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-2 space-y-1 text-xs">
        <div>
          <p className="font-medium text-muted-foreground">Ground Truth Reasoning:</p>
          <p className="text-muted-foreground">{question.ground_truth_reasoning}</p>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Judge's Reasoning:</p>
          <p className="text-muted-foreground">{result.predicted_reasoning}</p>
        </div>
      </div>
    </div>
  )
}


