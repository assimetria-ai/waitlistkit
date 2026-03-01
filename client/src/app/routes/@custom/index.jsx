import { Route } from 'react-router-dom'
import { WaitlistsPage } from '../../pages/app/@custom/WaitlistsPage'
import { WaitlistDetailPage } from '../../pages/app/@custom/WaitlistDetailPage'
import { SubscribersPage } from '../../pages/app/@custom/SubscribersPage'

export const customRoutes = [
  <Route key="waitlists" path="/app/waitlists" element={<WaitlistsPage />} />,
  <Route key="waitlists-new" path="/app/waitlists/new" element={<WaitlistsPage createMode />} />,
  <Route key="waitlists-detail" path="/app/waitlists/:id" element={<WaitlistDetailPage />} />,
  <Route key="subscribers" path="/app/subscribers" element={<SubscribersPage />} />,
]
