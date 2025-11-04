import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { Toaster } from './shared/components/Toaster'
import { Layout } from './components/Layout'
import { DataIngestion } from './features/ingestion/components/DataIngestion'
import { JudgesList } from './features/judges/components/JudgesList'
import { AssignmentsManager } from './features/assignments/components/AssignmentsManager'
import { AttachmentsManager } from './features/attachments/components/AttachmentsManager'
import { RunEvaluations } from './features/evaluations/components/RunEvaluations'
import { ResultsView } from './features/results/components/ResultsView'
import { AnalyticsPage } from './features/analytics/components/AnalyticsPage'
import { CalibrationPage } from './features/calibration/components/CalibrationPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/ingest" replace />} />
            <Route path="/ingest" element={<DataIngestion />} />
            <Route path="/judges" element={<JudgesList />} />
            <Route path="/assignments" element={<AssignmentsManager />} />
            <Route path="/attachments" element={<AttachmentsManager />} />
            <Route path="/evaluate" element={<RunEvaluations />} />
            <Route path="/results" element={<ResultsView />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/calibration" element={<CalibrationPage />} />
          </Routes>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
