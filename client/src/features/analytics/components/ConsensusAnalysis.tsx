import { Users, CheckCircle2, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Progress } from '@/shared/components/Progress'
import { useConsensusAnalysis, useInterRaterReliability } from '../hooks/useAnalytics'
import { Loader2 } from 'lucide-react'

export function ConsensusAnalysis() {
  const { data: consensus, isLoading: consensusLoading } = useConsensusAnalysis()
  const { data: reliability, isLoading: reliabilityLoading } = useInterRaterReliability()

  if (consensusLoading || reliabilityLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const getAgreementColor = (level: string) => {
    switch (level) {
      case 'unanimous':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'split':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'highly_disputed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'inconclusive':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Judge Consensus Analysis</CardTitle>
          </div>
          <CardDescription>
            Inter-rater reliability and agreement analysis for questions evaluated by multiple judges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reliability && (
            <div className="space-y-6">
              {/* Agreement Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Overall Agreement Rate</span>
                  </div>
                  <span className="text-3xl font-bold text-primary">
                    {reliability.agreement_rate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={reliability.agreement_rate} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {reliability.total_questions_with_multiple_judges} questions evaluated by multiple judges
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Unanimous
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {reliability.unanimous}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    All judges agree
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      Split Decision
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reliability.split}
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Partial agreement
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Disputed
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {reliability.highly_disputed}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    High disagreement
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Consensus Items */}
      {consensus && consensus.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question-by-Question Consensus</CardTitle>
            <CardDescription>
              Detailed breakdown of judge verdicts for each question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {consensus.map((item, idx) => (
                <div
                  key={`${item.submission_id}-${item.question_id}`}
                  className="p-4 border rounded-lg space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">
                          Q-{idx + 1}
                        </span>
                        <Badge className={getAgreementColor(item.agreement_level)}>
                          {item.agreement_level.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.judge_count} judges • {item.unique_verdicts} unique verdict{item.unique_verdicts !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getVerdictIcon(item.consensus_verdict)}
                      <span className="text-sm font-semibold capitalize">
                        Consensus: {item.consensus_verdict}
                      </span>
                    </div>
                  </div>

                  {/* Judge Verdicts */}
                  <div className="space-y-2 pl-4 border-l-2">
                    {item.judge_verdicts.map((jv: any, jIdx: number) => (
                      <div key={jIdx} className="flex items-start gap-3">
                        {getVerdictIcon(jv.verdict)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize flex items-center gap-2">
                            {jv.verdict}
                            <span className="text-xs text-muted-foreground font-normal">
                              (Judge {jIdx + 1})
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {jv.reasoning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No consensus data available</p>
            <p className="text-sm mt-2">
              Assign multiple judges to the same questions to see consensus analysis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

