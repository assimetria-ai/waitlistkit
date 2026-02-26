import { Route } from 'react-router-dom'
import { ErrorTrackingPage } from '../../pages/app/@custom/ErrorTrackingPage'
import { CollaboratorsPage } from '../../pages/app/@custom/CollaboratorsPage'
import { BrandSettingsPage } from '../../pages/app/@custom/BrandSettingsPage'
import { ChatbasePage } from '../../pages/app/@custom/ChatbasePage'
import { EmailTrackingPage } from '../../pages/app/@custom/EmailTrackingPage'
import { EmailPreviewPage } from '../../pages/app/@custom/EmailPreviewPage'
import { PrivateRoute } from '@/app/components/@system/PrivateRoute/PrivateRoute'

// @custom — add your product-specific routes here.
// Wrap with <PrivateRoute> for authenticated pages.
export const customRoutes: React.ReactElement[] = [
  <Route
    key="error-tracking"
    path="/app/errors"
    element={
      <PrivateRoute>
        <ErrorTrackingPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="collaborators"
    path="/app/collaborators"
    element={
      <PrivateRoute>
        <CollaboratorsPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="brand-settings"
    path="/app/brand"
    element={
      <PrivateRoute>
        <BrandSettingsPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="chatbase"
    path="/app/chatbase"
    element={
      <PrivateRoute>
        <ChatbasePage />
      </PrivateRoute>
    }
  />,
  <Route
    key="email-tracking"
    path="/app/emails"
    element={
      <PrivateRoute role="admin">
        <EmailTrackingPage />
      </PrivateRoute>
    }
  />,
  <Route
    key="email-preview"
    path="/app/emails/preview"
    element={
      <PrivateRoute role="admin">
        <EmailPreviewPage />
      </PrivateRoute>
    }
  />,
]
