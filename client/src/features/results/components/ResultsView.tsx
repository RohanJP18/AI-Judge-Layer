import { useState, useMemo } from 'react'
import { Filter, Loader2, TrendingUp, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Checkbox } from '@/shared/components/Checkbox'
import { Label } from '@/shared/components/Label'
import { useEvaluations, useEvaluationStats } from '../hooks/useResults'
import { useJudges } from '@/features/judges/hooks/useJudges'
import { useQuestionTemplates } from '@/features/ingestion/hooks/useIngestion'
import { formatDateTime } from '@/shared/lib/utils'
import type { Verdict } from '@/shared/types/schemas'
import type { EvaluationFilters } from '@/features/evaluations/api'
import { EvaluationCharts } from './EvaluationCharts'
import { ExportResults } from './ExportResults'

export function ResultsView() {
  const [showFilters, setShowFilters] = useState(false)
  const [showCharts, setShowCharts] = useState(true)
  const [filters, setFilters] = useState<EvaluationFilters>({
    judgeIds: [],
    questionIds: [],
    verdicts: [],
  })

  const { data: allEvaluations, isLoading } = useEvaluations()
  const { data: judges } = useJudges()
  const { data: questionTemplates } = useQuestionTemplates()
  const { data: stats } = useEvaluationStats(filters)

  // Filter evaluations client-side
  const filteredEvaluations = useMemo(() => {
    if (!allEvaluations) return []

    return allEvaluations.filter((evaluation) => {
      // Judge filter
      if (
        filters.judgeIds &&
        filters.judgeIds.length > 0 &&
        evaluation.judge_id &&
        !filters.judgeIds.includes(evaluation.judge_id)
      ) {
        return false
      }

      // Question filter (by template question_id)
      if (
        filters.questionIds &&
        filters.questionIds.length > 0 &&
        evaluation.template_question_id &&
        !filters.questionIds.includes(evaluation.template_question_id)
      ) {
        return false
      }

      // Verdict filter
      if (
        filters.verdicts &&
        filters.verdicts.length > 0 &&
        !filters.verdicts.includes(evaluation.verdict)
      ) {
        return false
      }

      return true
    })
  }, [allEvaluations, filters])

  const toggleJudgeFilter = (judgeId: string) => {
    setFilters((prev) => {
      const judgeIds = prev.judgeIds || []
      if (judgeIds.includes(judgeId)) {
        return { ...prev, judgeIds: judgeIds.filter((id) => id !== judgeId) }
      } else {
        return { ...prev, judgeIds: [...judgeIds, judgeId] }
      }
    })
  }

  const toggleQuestionFilter = (questionId: string) => {
    setFilters((prev) => {
      const questionIds = prev.questionIds || []
      if (questionIds.includes(questionId)) {
        return {
          ...prev,
          questionIds: questionIds.filter((id) => id !== questionId),
        }
      } else {
        return { ...prev, questionIds: [...questionIds, questionId] }
      }
    })
  }

  const toggleVerdictFilter = (verdict: Verdict) => {
    setFilters((prev) => {
      const verdicts = prev.verdicts || []
      if (verdicts.includes(verdict)) {
        return { ...prev, verdicts: verdicts.filter((v) => v !== verdict) }
      } else {
        return { ...prev, verdicts: [...verdicts, verdict] }
      }
    })
  }

  const clearFilters = () => {
    setFilters({ judgeIds: [], questionIds: [], verdicts: [] })
  }

  const getVerdictBadgeVariant = (verdict: Verdict) => {
    switch (verdict) {
      case 'pass':
        return 'success'
      case 'fail':
        return 'destructive'
      case 'inconclusive':
        return 'warning'
      default:
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evaluation Statistics</CardTitle>
              <CardDescription>
                Aggregate pass rate and verdict distribution
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ExportResults />
              <Button
                variant={showCharts ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCharts(!showCharts)}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Charts
              </Button>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              {(filters.judgeIds?.length || 0) +
                (filters.questionIds?.length || 0) +
                (filters.verdicts?.length || 0) >
                0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 border rounded-lg col-span-2 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
              <p className="text-4xl font-bold text-primary">
                {stats?.passRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats?.pass} of {stats?.total} evaluations
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Pass</p>
              <p className="text-3xl font-bold text-green-600">{stats?.pass}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Fail</p>
              <p className="text-3xl font-bold text-red-600">{stats?.fail}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Inconclusive</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats?.inconclusive}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Panel */}
      {showCharts && filteredEvaluations.length > 0 && (
        <EvaluationCharts 
          evaluations={filteredEvaluations} 
          judges={judges || []} 
        />
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* Judge Filter */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Judges
                </Label>
                <div className="space-y-2">
                  {judges?.map((judge) => (
                    <div key={judge.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`judge-${judge.id}`}
                        checked={filters.judgeIds?.includes(judge.id)}
                        onCheckedChange={() => toggleJudgeFilter(judge.id)}
                      />
                      <Label
                        htmlFor={`judge-${judge.id}`}
                        className="cursor-pointer text-sm"
                      >
                        {judge.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Filter */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Questions
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {questionTemplates?.map((question) => (
                    <div key={question.question_id} className="flex items-start gap-2">
                      <Checkbox
                        id={`question-${question.question_id}`}
                        checked={filters.questionIds?.includes(
                          question.question_id
                        )}
                        onCheckedChange={() =>
                          toggleQuestionFilter(question.question_id)
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`question-${question.question_id}`}
                        className="cursor-pointer text-sm line-clamp-2"
                      >
                        {question.question_text}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verdict Filter */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Verdicts
                </Label>
                <div className="space-y-2">
                  {(['pass', 'fail', 'inconclusive'] as Verdict[]).map(
                    (verdict) => (
                      <div key={verdict} className="flex items-center gap-2">
                        <Checkbox
                          id={`verdict-${verdict}`}
                          checked={filters.verdicts?.includes(verdict)}
                          onCheckedChange={() => toggleVerdictFilter(verdict)}
                        />
                        <Label
                          htmlFor={`verdict-${verdict}`}
                          className="cursor-pointer text-sm capitalize"
                        >
                          {verdict}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results</CardTitle>
          <CardDescription>
            {filteredEvaluations.length} evaluation(s){' '}
            {(filters.judgeIds?.length || 0) +
              (filters.questionIds?.length || 0) +
              (filters.verdicts?.length || 0) >
            0
              ? '(filtered)'
              : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvaluations.length > 0 ? (
            <div className="space-y-3">
              {filteredEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={getVerdictBadgeVariant(evaluation.verdict)}
                        >
                          {evaluation.verdict}
                        </Badge>
                        <span className="text-sm font-medium">
                          {evaluation.judge_name || 'Unknown Judge'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {evaluation.model_name}
                        </span>
                      </div>

                      <p className="text-sm font-medium mb-1">
                        {evaluation.question_text || 'Question'}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {evaluation.reasoning}
                      </p>
                    </div>

                    <div className="text-xs text-muted-foreground text-right">
                      <p>{formatDateTime(evaluation.created_at)}</p>
                      {evaluation.duration_ms && (
                        <p className="mt-1">
                          {(evaluation.duration_ms / 1000).toFixed(2)}s
                        </p>
                      )}
                    </div>
                  </div>

                  {evaluation.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                      Error: {evaluation.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-semibold mb-1">No evaluations found</p>
              <p className="text-sm text-muted-foreground">
                {(filters.judgeIds?.length || 0) +
                  (filters.questionIds?.length || 0) +
                  (filters.verdicts?.length || 0) >
                0
                  ? 'Try adjusting your filters'
                  : 'Run evaluations to see results here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

