import { DollarSign, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { useCostSummary } from '../hooks/useAnalytics'
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
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

export function CostTracking() {
  const { data: costs, isLoading } = useCostSummary()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!costs || costs.total_evaluations === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Cost Tracking</CardTitle>
          </div>
          <CardDescription>
            Monitor LLM API usage and estimated costs
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No cost data available yet</p>
          <p className="text-sm mt-2">
            Run evaluations to see cost tracking and analytics
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `<$0.01`
    return `$${cost.toFixed(4)}`
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
    return tokens.toString()
  }

  const avgCostPerEval = costs.total_cost / costs.total_evaluations

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle>Cost Tracking & Budget</CardTitle>
              </div>
              <CardDescription>
                Real-time monitoring of LLM API usage and estimated costs
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {costs.total_evaluations} evaluations
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {/* Total Cost */}
            <div className="p-4 border rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
              <p className="text-3xl font-bold text-primary">
                ${costs.total_cost.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCost(avgCostPerEval)} per evaluation
              </p>
            </div>

            {/* Input Tokens */}
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Input Tokens</p>
              <p className="text-2xl font-bold">
                {formatTokens(costs.total_input_tokens)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ~{Math.round(costs.total_input_tokens / costs.total_evaluations)} avg
              </p>
            </div>

            {/* Output Tokens */}
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Output Tokens</p>
              <p className="text-2xl font-bold">
                {formatTokens(costs.total_output_tokens)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ~{Math.round(costs.total_output_tokens / costs.total_evaluations)} avg
              </p>
            </div>

            {/* Total Tokens */}
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Tokens</p>
              <p className="text-2xl font-bold">
                {formatTokens(costs.total_input_tokens + costs.total_output_tokens)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Combined usage
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model */}
        {costs.cost_by_model.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost by Model</CardTitle>
              <CardDescription>
                Breakdown of costs across different LLM models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costs.cost_by_model}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="model_name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${value.toFixed(4)}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                  <Legend />
                  <Bar dataKey="cost" fill="#3b82f6" name="Cost ($)" animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>

              {/* Model Details Table */}
              <div className="mt-4 space-y-2">
                {costs.cost_by_model.map((model) => (
                  <div key={model.model_name} className="flex items-center justify-between text-sm border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium">{model.model_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {model.count} evaluations • {formatTokens(model.input_tokens + model.output_tokens)} tokens
                      </p>
                    </div>
                    <p className="font-mono font-semibold">
                      {formatCost(model.cost)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost by Judge */}
        {costs.cost_by_judge.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost by Judge</CardTitle>
              <CardDescription>
                Which judges are using the most resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costs.cost_by_judge}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cost"
                    animationDuration={1000}
                  >
                    {costs.cost_by_judge.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: any) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Judge Details */}
              <div className="mt-4 space-y-2">
                {costs.cost_by_judge.map((judge) => (
                  <div key={judge.judge_id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <p className="font-medium">{judge.judge_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {judge.count} evaluations
                      </p>
                    </div>
                    <p className="font-mono font-semibold">
                      {formatCost(judge.cost)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cost Optimization Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Cost Optimization Tips
              </h3>
              <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-300 list-disc list-inside">
                <li>Consider using GPT-3.5-Turbo or Gemini Flash for simple evaluations (90% cost reduction)</li>
                <li>Use prompt configuration to reduce input token count by excluding unnecessary fields</li>
                <li>Batch evaluations to reduce API overhead</li>
                <li>Current average: <strong>{formatCost(avgCostPerEval)}</strong> per evaluation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

