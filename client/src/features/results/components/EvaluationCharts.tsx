import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import type { EvaluationWithDetails } from '@/features/evaluations/api'

interface EvaluationChartsProps {
  evaluations: EvaluationWithDetails[]
  judges: { id: string; name: string }[]
}

const VERDICT_COLORS = {
  pass: '#22c55e',
  fail: '#ef4444',
  inconclusive: '#eab308',
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

export function EvaluationCharts({ evaluations, judges }: EvaluationChartsProps) {
  // Pass rate by judge
  const judgePassRateData = useMemo(() => {
    const judgeStats = new Map<string, { pass: number; fail: number; inconclusive: number; total: number }>()

    evaluations.forEach((evaluation) => {
      if (!evaluation.judge_id) return

      const judgeName = evaluation.judge_name || 'Unknown'
      const stats = judgeStats.get(judgeName) || { pass: 0, fail: 0, inconclusive: 0, total: 0 }

      stats[evaluation.verdict]++
      stats.total++

      judgeStats.set(judgeName, stats)
    })

    return Array.from(judgeStats.entries()).map(([name, stats]) => ({
      name,
      passRate: ((stats.pass / stats.total) * 100).toFixed(1),
      pass: stats.pass,
      fail: stats.fail,
      inconclusive: stats.inconclusive,
      total: stats.total,
    }))
  }, [evaluations])

  // Verdict distribution (overall)
  const verdictDistribution = useMemo(() => {
    const distribution = { pass: 0, fail: 0, inconclusive: 0 }

    evaluations.forEach((evaluation) => {
      distribution[evaluation.verdict]++
    })

    return [
      { name: 'Pass', value: distribution.pass, color: VERDICT_COLORS.pass },
      { name: 'Fail', value: distribution.fail, color: VERDICT_COLORS.fail },
      { name: 'Inconclusive', value: distribution.inconclusive, color: VERDICT_COLORS.inconclusive },
    ].filter((item) => item.value > 0)
  }, [evaluations])

  // Evaluations over time (by verdict)
  const evaluationsOverTime = useMemo(() => {
    const timeGroups = new Map<string, { pass: number; fail: number; inconclusive: number }>()

    evaluations.forEach((evaluation) => {
      const date = new Date(evaluation.created_at).toLocaleDateString()
      const group = timeGroups.get(date) || { pass: 0, fail: 0, inconclusive: 0 }
      group[evaluation.verdict]++
      timeGroups.set(date, group)
    })

    return Array.from(timeGroups.entries())
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [evaluations])

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          No data available for charts
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pass Rate by Judge - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pass Rate by Judge</CardTitle>
          <CardDescription>
            Comparison of pass rates across different judges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={judgePassRateData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" />
              <YAxis label={{ value: '# of Evaluations', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                formatter={(value, name) => {
                  if (name === 'passRate') return `${value}%`
                  return value
                }}
              />
              <Legend />
              <Bar dataKey="pass" fill={VERDICT_COLORS.pass} name="Pass" animationDuration={1000} />
              <Bar dataKey="fail" fill={VERDICT_COLORS.fail} name="Fail" animationDuration={1000} />
              <Bar dataKey="inconclusive" fill={VERDICT_COLORS.inconclusive} name="Inconclusive" animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verdict Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Verdict Distribution</CardTitle>
            <CardDescription>
              Overall breakdown of evaluation verdicts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={verdictDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                  animationBegin={0}
                >
                  {verdictDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evaluations Over Time - Line Chart */}
        {evaluationsOverTime.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluations Over Time</CardTitle>
              <CardDescription>
                Trend of verdicts over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evaluationsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="pass" stroke={VERDICT_COLORS.pass} strokeWidth={2} animationDuration={1500} />
                  <Line type="monotone" dataKey="fail" stroke={VERDICT_COLORS.fail} strokeWidth={2} animationDuration={1500} />
                  <Line type="monotone" dataKey="inconclusive" stroke={VERDICT_COLORS.inconclusive} strokeWidth={2} animationDuration={1500} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

