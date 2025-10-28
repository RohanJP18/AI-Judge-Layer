import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/Card'
import { Progress } from '@/shared/components/Progress'

interface EvaluationProgressProps {
  planned: number
  completed: number
  failed: number
  isRunning: boolean
  startTime?: number
}

export function EvaluationProgress({
  planned,
  completed,
  failed,
  isRunning,
  startTime,
}: EvaluationProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isRunning || !startTime) return

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning, startTime])

  const progress = planned > 0 ? ((completed + failed) / planned) * 100 : 0
  const remaining = planned - completed - failed
  const rate = elapsedTime > 0 ? ((completed + failed) / elapsedTime) * 1000 : 0 // evals per second
  const estimatedTimeRemaining = rate > 0 ? (remaining / rate) * 1000 : 0

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  if (planned === 0 && !isRunning) return null

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Evaluation Progress</span>
            <span className="text-muted-foreground">
              {completed + failed} / {planned}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Loader2 className={`h-4 w-4 ${isRunning ? 'animate-spin text-blue-600' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-2xl font-bold text-blue-600">{remaining}</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
        </div>

        {isRunning && startTime && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Elapsed: {formatTime(elapsedTime)}
              </span>
            </div>
            {rate > 0 && (
              <span className="text-muted-foreground">
                ~{rate.toFixed(1)}/s • ETA: {formatTime(estimatedTimeRemaining)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

