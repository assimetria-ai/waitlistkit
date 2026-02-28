// @system — Unified auth page: login + register tabs
// Reads ?tab=register from the URL to open the register tab by default.
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../../store/@system/auth'
import { Button } from '../../../components/@system/ui/button'
import { FormField, Input } from '../../../components/@system/Form/Form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/@system/Tabs/Tabs'
import { info } from '../../../../config/@system/info'
import { OAuthButtons } from '../../../components/@system/OAuthButtons/OAuthButtons'
import { api } from '../../../lib/@system/api'

export function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { login, register, refresh } = useAuthContext()

  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [tab, setTab] = useState(defaultTab)

  // OAuth error surfaced via ?error= query param
  const oauthError = searchParams.get('error') === 'oauth_failed'
    ? 'OAuth sign-in failed. Please try again or use email & password.'
    : null

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  // Where to redirect after login
  const from = (location.state)?.from?.pathname ?? '/app'

  useEffect(() => {
    setLoginError('')
    setRegError('')
  }, [tab])

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const result = await api.post('/sessions', {
        email: loginEmail,
        password: loginPassword })
      if (result?.totp_required) {
        // Credentials valid but 2FA required — hand off to the TOTP challenge page
        navigate('/2fa/verify', { state })
        return
      }
      // Session cookie already set by the server; refresh auth context
      await refresh()
      navigate(from, { replace: true })
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setRegError('')
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match')
      return
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters')
      return
    }
    setRegLoading(true)
    try {
      await register(regName, regEmail, regPassword)
      navigate('/app', { replace: true })
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold tracking-tight text-foreground">
            {info.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-0">
            <Tabs value={tab} onValueChange={(v) => setTab(v)}>
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* ── Login ── */}
              <TabsContent value="login">
                <CardContent className="pt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <FormField label="Email" required>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </FormField>
                    <FormField label="Password" required>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </FormField>
                    <div className="flex justify-end">
                      <Link
                        to="/forgot-password"
                        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    {loginError && (
                      <p className="text-sm text-destructive">{loginError}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={loginLoading}>
                      {loginLoading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </form>

                  <OAuthButtons className="mt-4" />
                </CardContent>
              </TabsContent>

              {/* ── Register ── */}
              <TabsContent value="register">
                <CardContent className="pt-6">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <FormField label="Name" required>
                      <Input
                        type="text"
                        placeholder="Your name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </FormField>
                    <FormField label="Email" required>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </FormField>
                    <FormField label="Password" required>
                      <Input
                        type="password"
                        placeholder="Min 8 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </FormField>
                    <FormField label="Confirm Password" required>
                      <Input
                        type="password"
                        placeholder="Re-enter your password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </FormField>
                    {regError && (
                      <p className="text-sm text-destructive">{regError}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={regLoading}>
                      {regLoading ? 'Creating account…' : 'Create Account'}
                    </Button>
                  </form>

                  <OAuthButtons className="mt-4" />
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {oauthError && (
          <p className="text-center text-sm text-destructive">{oauthError}</p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{' '}
          <a href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
