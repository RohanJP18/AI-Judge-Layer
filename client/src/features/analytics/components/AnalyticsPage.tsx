import { useState } from 'react'
import { BarChart3, Users, DollarSign, Bug } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { ConsensusAnalysis } from './ConsensusAnalysis'
import { CostTracking } from './CostTracking'
import { DebugMode } from './DebugMode'

type Tab = 'consensus' | 'costs' | 'debug'

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('consensus')

  const tabs = [
    {
      id: 'consensus' as Tab,
      name: 'Judge Consensus',
      icon: Users,
      description: 'Inter-rater reliability analysis',
    },
    {
      id: 'costs' as Tab,
      name: 'Cost Tracking',
      icon: DollarSign,
      description: 'Budget & token usage',
    },
    {
      id: 'debug' as Tab,
      name: 'Debug Mode',
      icon: Bug,
      description: 'Prompts & responses',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Analytics Suite</h1>
        </div>
        <p className="text-muted-foreground">
          Advanced analytics, cost tracking, and debugging tools for your AI judge system
        </p>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-2">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="justify-start h-auto py-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium">{tab.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div>
        {activeTab === 'consensus' && <ConsensusAnalysis />}
        {activeTab === 'costs' && <CostTracking />}
        {activeTab === 'debug' && <DebugMode />}
      </div>
    </div>
  )
}

