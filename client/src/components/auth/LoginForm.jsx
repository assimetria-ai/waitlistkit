// LoginForm — reusable email+password login form component
// Calls POST /api/auth/login and invokes onSuccess(result) on completion.
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { FormField, Input } from '@/app/components/@system/Form'
import { Button } from '@/app/components/@system/ui/button'
import { api } from '@/app/lib/@system/api'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

/**
 * Standalone login form. Calls POST /api/auth/login.
 *
 * Props:
 *   onSuccess(result) — called with the API response on successful login.
 *                       result.totp_required === true means 2FA is needed.
 */
export function LoginForm({ onSuccess }) {
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values) {
    setServerError(null)
    try {
      const result = await api.post('/auth/login', values)
      onSuccess?.(result)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    }
  }

  return (
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

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Forgot password?
        </Link>
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  )
}
