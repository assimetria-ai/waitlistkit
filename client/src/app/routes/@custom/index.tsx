import { Route } from 'react-router-dom'
import { WaitlistKitDashboardPage } from '../../pages/app/@custom/WaitlistKitDashboardPage'

export const customRoutes: React.ReactElement[] = [
  <Route key="waitlistkit-dashboard" path="/app/waitlists" element={<WaitlistKitDashboardPage />} />,
]
