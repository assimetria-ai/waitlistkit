import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/routes/@system/AppRoutes'
import { Toaster } from './app/components/@system/Toast/Toaster'
import { AuthProvider } from './app/store/@system/auth'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}
