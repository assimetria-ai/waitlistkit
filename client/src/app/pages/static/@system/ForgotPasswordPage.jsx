// @system — Forgot password page
// Sends a reset link to the user's email via POST /api/users/password/request
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '../../../components/@system/ui/button'
import { FormField, Input } from '../../../components/@system/Form/Form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { api } from '../../../lib/@system/api'
import { info } from '../../../../config/@system/info'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/users/password/request', { email })
      setSubmitted(true)
    } catch {
      // Still show success to avoid user enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
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
          <p className="mt-1 text-sm text-muted-foreground">Password reset</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If <span className="font-medium text-foreground">{email}</span> is
                    registered, you'll receive a reset link shortly. Check your inbox
                    and spam folder.
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Email" required>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </FormField>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/auth">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Link>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
