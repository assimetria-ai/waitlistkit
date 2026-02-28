// @system — re-exports useAuth from the main auth store.
// The full AuthProvider (login/register/logout/refresh) lives in store/@system/auth.jsx.
export { useAuthContext as useAuth } from '../../store/@system/auth'
