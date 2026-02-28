import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/app/components/@system/ui/button'
import { FormField, Input } from '@/app/components/@system/Form/Form'
import { api } from '@/app/lib/@system/api'
import { useAuthContext } from '@/app/store/@system/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required') })

export function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuthContext()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema) })

  async function onSubmit(values) {
    setServerError(null)
    try {
      const result = await api.post('/sessions', values)
      if (result?.totp_required) {
        // Password correct but TOTP required — forward credentials to the 2FA challenge page
        navigate('/2fa/verify', { state })
        return
      }
      // Session cookie set — populate auth context then navigate
      await refresh()
      navigate('/app')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-xl font-bold text-foreground">
            ProductTemplate
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Email" error={errors.email?.message} required>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={!!errors.email}
              {...register('email')}
            />
          </FormField>

          <FormField label="Password" error={errors.password?.message} required>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={!!errors.password}
              {...register('password')}
            />
          </FormField>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account{' '}
          <Link to="/register" className="font-medium text-foreground underline underline-offset-4 hover:no-underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
