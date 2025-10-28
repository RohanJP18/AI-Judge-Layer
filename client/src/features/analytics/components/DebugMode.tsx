import { useState } from 'react'
import { Bug, Search, Copy, CheckCircle2, XCircle, AlertTriangle, Loader2, Code } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { Input } from '@/shared/components/Input'
import { Button } from '@/shared/components/Button'
import { useDebugEvaluations } from '../hooks/useAnalytics'
import { useToast } from '@/shared/hooks/useToast'
import { formatDateTime } from '@/shared/lib/utils'

export function DebugMode() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEval, setSelectedEval] = useState<any>(null)
  const { data: evaluations, isLoading } = useDebugEvaluations()
  const { toast } = useToast()

  const filteredEvaluations = evaluations?.filter((ev) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      ev.judge_name.toLowerCase().includes(search) ||
      ev.model_name.toLowerCase().includes(search) ||
      ev.verdict.toLowerCase().includes(search) ||
      ev.reasoning.toLowerCase().includes(search)
    )
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      description: `${label} copied successfully`,
    })
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

  const getVerdictColor = (verdict: string) => {
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            <CardTitle>Evaluation Debug Mode</CardTitle>
          </div>
          <CardDescription>
            View exact prompts, raw responses, and execution details
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No debug data available yet</p>
          <p className="text-sm mt-2">
            Debug information will be available after running evaluations
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                <CardTitle>Evaluation Debug Mode</CardTitle>
              </div>
              <CardDescription>
                Inspect prompts, responses, and execution details for troubleshooting
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredEvaluations?.length || 0} evaluations
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by judge, model, verdict, or reasoning..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evaluations List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evaluation History</CardTitle>
            <CardDescription>
              Click to inspect details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[700px] overflow-y-auto">
              {filteredEvaluations?.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEval(ev)}
                  className={`w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors ${
                    selectedEval?.id === ev.id ? 'border-primary bg-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getVerdictIcon(ev.verdict)}
                      <Badge className={getVerdictColor(ev.verdict) + ' text-xs'}>
                        {ev.verdict}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {ev.judge_name}
                      </span>
                    </div>
                    {ev.retry_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {ev.retry_count} retries
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {ev.model_name} • {ev.duration_ms}ms • {formatDateTime(ev.created_at)}
                  </p>
                  {ev.input_tokens && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {ev.input_tokens} in / {ev.output_tokens} out tokens
                      {ev.estimated_cost && ` • $${ev.estimated_cost.toFixed(4)}`}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Debug Details */}
        {selectedEval ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Execution Details</CardTitle>
              <CardDescription>
                ID: {selectedEval.id.slice(0, 8)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[700px] overflow-y-auto">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Judge</p>
                  <p className="font-medium">{selectedEval.judge_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">{selectedEval.model_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedEval.duration_ms}ms</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Retries</p>
                  <p className="font-medium">{selectedEval.retry_count}</p>
                </div>
                {selectedEval.input_tokens && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Input Tokens</p>
                      <p className="font-medium">{selectedEval.input_tokens}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Output Tokens</p>
                      <p className="font-medium">{selectedEval.output_tokens}</p>
                    </div>
                  </>
                )}
                {selectedEval.estimated_cost && (
                  <div>
                    <p className="text-muted-foreground">Estimated Cost</p>
                    <p className="font-medium">${selectedEval.estimated_cost.toFixed(4)}</p>
                  </div>
                )}
              </div>

              {/* Prompt Sent */}
              {selectedEval.prompt_sent && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <p className="font-semibold">Prompt Sent to LLM</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedEval.prompt_sent, 'Prompt')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    {selectedEval.prompt_sent}
                  </pre>
                </div>
              )}

              {/* Raw Response */}
              {selectedEval.raw_response && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <p className="font-semibold">Raw LLM Response</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(selectedEval.raw_response, 'Response')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
                    {selectedEval.raw_response}
                  </pre>
                </div>
              )}

              {/* Parsed Verdict */}
              <div className="space-y-2">
                <p className="font-semibold">Parsed Verdict & Reasoning</p>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getVerdictIcon(selectedEval.verdict)}
                    <Badge className={getVerdictColor(selectedEval.verdict)}>
                      {selectedEval.verdict}
                    </Badge>
                  </div>
                  <p className="text-sm">{selectedEval.reasoning}</p>
                </div>
              </div>

              {/* Error */}
              {selectedEval.error && (
                <div className="space-y-2">
                  <p className="font-semibold text-red-600">Error</p>
                  <pre className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-xs overflow-x-auto">
                    {selectedEval.error}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-24 text-muted-foreground">
              <div className="text-center">
                <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an evaluation to view details</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

