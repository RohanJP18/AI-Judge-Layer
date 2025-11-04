import { useState } from 'react'
import { Target, Upload } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/Card'
import { GoldenSetUpload } from './GoldenSetUpload'
import { CalibrationRunner } from './CalibrationRunner'

export function CalibrationPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'calibrate'>('upload')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Golden Set Calibration</h1>
        <p className="text-muted-foreground">
          Ensure judge quality with pre-evaluated benchmark questions
        </p>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            <button
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload className="h-5 w-5" />
              Upload Golden Set
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'calibrate'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab('calibrate')}
            >
              <Target className="h-5 w-5" />
              Run Calibration
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === 'upload' ? <GoldenSetUpload /> : <CalibrationRunner />}

      {/* Info Panel */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              🎯 Why Golden Set Calibration?
            </h3>
            <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>Ensure Quality:</strong> Validate judge accuracy before production use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>Statistical Rigor:</strong> Precision, recall, F1 scores, and confusion matrices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>Continuous Monitoring:</strong> Track judge performance over time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-purple-600 dark:text-purple-400 mt-0.5">✓</span>
                <span><strong>90% Threshold:</strong> Only judges scoring ≥90% pass calibration</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


