import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { Toaster } from './shared/components/Toaster'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { LoginPage } from './features/auth/components/LoginPage'
import { SignUpPage } from './features/auth/components/SignUpPage'
import { DataIngestion } from './features/ingestion/components/DataIngestion'
import { JudgesList } from './features/judges/components/JudgesList'
import { AssignmentsManager } from './features/assignments/components/AssignmentsManager'
import { AttachmentsManager } from './features/attachments/components/AttachmentsManager'
import { RunEvaluations } from './features/evaluations/components/RunEvaluations'
import { ResultsView } from './features/results/components/ResultsView'
import { AnalyticsPage } from './features/analytics/components/AnalyticsPage'
import { CalibrationPage } from './features/calibration/components/CalibrationPage'
import { WelcomeModal } from './features/onboarding/components/WelcomeModal'
import { SettingsPage } from './features/settings/components/SettingsPage'
import { AssistantWidget } from './features/assistant/components/AssistantWidget'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
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
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                  <WelcomeModal onComplete={() => {}} />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
        <AssistantWidget />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
