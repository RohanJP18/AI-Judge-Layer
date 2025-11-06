import { useState } from 'react'
import { Play, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { useRunEvaluations } from '../hooks/useRunEvaluations'
import { useSubmissions } from '@/features/ingestion/hooks/useIngestion'
import { useJudgeAssignments } from '@/features/assignments/hooks/useAssignments'
import { useActiveJudges } from '@/features/judges/hooks/useJudges'
import { EvaluationProgress } from './EvaluationProgress'

export function RunEvaluations() {
  const [result, setResult] = useState<{
    planned: number
    completed: number
    failed: number
  } | null>(null)
  const [startTime, setStartTime] = useState<number | undefined>()

  const runMutation = useRunEvaluations()
  const { data: submissions } = useSubmissions()
  const { data: assignments } = useJudgeAssignments()
  const { data: activeJudges } = useActiveJudges()

  // Calculate planned evaluations
  const plannedEvaluations = assignments?.length || 0
  const totalSubmissions = submissions?.length || 0
  const totalActiveJudges = activeJudges?.length || 0

  const handleRun = () => {
    setStartTime(Date.now())
    setResult(null)
    runMutation.mutate(
      {},
      {
        onSuccess: (data) => {
          setResult(data)
          setStartTime(undefined)
        },
        onError: () => {
          setStartTime(undefined)
        },
      }
    )
  }

  const isRunning = runMutation.isPending
  const canRun = plannedEvaluations > 0 && totalSubmissions > 0 && totalActiveJudges > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Run AI Judges</CardTitle>
          <CardDescription>
            Execute evaluations for all assigned judges and questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Submissions</p>
              <p className="text-2xl font-bold">{totalSubmissions}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Active Judges</p>
              <p className="text-2xl font-bold">{totalActiveJudges}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Assignments
              </p>
              <p className="text-2xl font-bold">{plannedEvaluations}</p>
            </div>
          </div>

          {/* Warnings/Info */}
          {!canRun && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Cannot run evaluations
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {totalSubmissions === 0 && 'No submissions imported. '}
                  {totalActiveJudges === 0 && 'No active judges configured. '}
                  {plannedEvaluations === 0 && 'No judge assignments created. '}
                </p>
              </div>
            </div>
          )}

          {/* Run Button */}
          <div className="flex items-center justify-center">
            <Button
              onClick={handleRun}
              disabled={!canRun || isRunning}
              size="lg"
              className="px-8"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Evaluations...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Run AI Judges
                </>
              )}
            </Button>
          </div>

          {/* Progress/Results */}
          {isRunning && (
            <>
              <EvaluationProgress
                planned={plannedEvaluations}
                completed={0}
                failed={0}
                isRunning={isRunning}
                startTime={startTime}
              />
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Evaluations in progress
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Calling LLM APIs for each question-judge pair...
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {result && !isRunning && (
            <div className="space-y-4">
              <EvaluationProgress
                planned={result.planned}
                completed={result.completed}
                failed={result.failed}
                isRunning={false}
              />
              
              <h3 className="text-lg font-semibold">Evaluation Results</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Completed
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {result.completed}
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <p className="font-semibold text-red-900 dark:text-red-100">
                      Failed
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {result.failed}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <p className="font-semibold">Planned</p>
                  </div>
                  <p className="text-3xl font-bold">{result.planned}</p>
                </div>
              </div>

              {result.completed > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Evaluations complete! View results in the Results tab.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Iterates through all submissions in the database</li>
              <li>For each question, calls assigned judges' LLM APIs</li>
              <li>Parses responses to extract verdict and reasoning</li>
              <li>Stores evaluation results in the database</li>
              <li>Handles errors gracefully (timeouts, rate limits, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

