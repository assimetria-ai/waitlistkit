// OnboardingWizard — 3-step setup flow shown to new users after registration.
// Step 1: Profile  — name + job title
// Step 2: Preferences — use case + theme
// Step 3: Team — invite teammates (optional)
// On completion calls POST /api/onboarding/complete and updates the auth context.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, Users, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/app/components/@system/ui/button'
import { FormField, Input } from '@/app/components/@system/Form'
import { useAuthContext } from '@/app/store/@system/auth'

const STEPS = [
  { id: 'profile',      label: 'Profile',      icon: User,     description: 'Tell us about yourself' },
  { id: 'preferences',  label: 'Preferences',  icon: Settings, description: 'Customize your experience' },
  { id: 'team',         label: 'Team',         icon: Users,    description: 'Invite your team (optional)' },
]

const USE_CASES = [
  { value: 'personal',      label: 'Personal project' },
  { value: 'startup',       label: 'Startup' },
  { value: 'small_business', label: 'Small business' },
  { value: 'enterprise',    label: 'Enterprise' },
]

// ── Step 1: Profile ──────────────────────────────────────────────────────────

function ProfileStep({ data, onChange }) {
  return (
    <div className="space-y-4">
      <FormField label="Full name" required>
        <Input
          value={data.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Jane Smith"
          autoFocus
        />
      </FormField>

      <FormField label="Job title">
        <Input
          value={data.jobTitle ?? ''}
          onChange={(e) => onChange({ jobTitle: e.target.value })}
          placeholder="Product Manager"
        />
      </FormField>
    </div>
  )
}

// ── Step 2: Preferences ──────────────────────────────────────────────────────

function PreferencesStep({ data, onChange }) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium mb-2">How will you use this?</legend>
        <div className="grid grid-cols-2 gap-2">
          {USE_CASES.map(({ value, label }) => {
            const active = data.useCase === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ useCase: value })}
                className={[
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <FormField label="How did you hear about us?">
        <Input
          value={data.referralSource ?? ''}
          onChange={(e) => onChange({ referralSource: e.target.value })}
          placeholder="Twitter, friend, Google…"
        />
      </FormField>
    </div>
  )
}

// ── Step 3: Team ─────────────────────────────────────────────────────────────

function TeamStep({ data, onChange }) {
  const raw = data.inviteEmails ?? ''

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter email addresses to invite teammates. You can also do this later from Settings.
      </p>

      <FormField label="Invite by email" hint="Separate multiple addresses with commas">
        <Input
          value={raw}
          onChange={(e) => onChange({ inviteEmails: e.target.value })}
          placeholder="alice@example.com, bob@example.com"
        />
      </FormField>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const done = i < current
        const active = i === current

        return (
          <li key={step.id} className="flex items-center">
            <span
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                done
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground',
              ].join(' ')}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span
              className={[
                'ml-2 hidden text-sm sm:block',
                active ? 'font-medium text-foreground' : 'text-muted-foreground',
              ].join(' ')}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-3 h-px w-6 bg-border sm:w-10" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * OnboardingWizard — full-page 3-step setup flow.
 *
 * Props:
 *   onComplete(user) — optional callback invoked after POST /api/onboarding/complete.
 *                      Defaults to redirecting to '/app'.
 */
export function OnboardingWizard({ onComplete }) {
  const navigate = useNavigate()
  const { completeOnboarding } = useAuthContext()

  const [step, setStep]   = useState(0)
  const [data, setData]   = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function merge(partial) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }

    // Final step — submit
    setError(null)
    setLoading(true)
    try {
      const payload = {
        name:           data.name?.trim()           || undefined,
        useCase:        data.useCase                || undefined,
        referralSource: data.referralSource?.trim() || undefined,
      }
      const user = await completeOnboarding(payload)

      if (onComplete) {
        onComplete(user)
      } else {
        navigate('/app', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isLastStep = step === STEPS.length - 1
  const canProceed = step === 0 ? (data.name?.trim().length ?? 0) >= 1 : true

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo / brand placeholder */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's get your account set up in a few quick steps.
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">{STEPS[step].label}</h2>
            <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
          </div>

          {step === 0 && <ProfileStep     data={data} onChange={merge} />}
          {step === 1 && <PreferencesStep data={data} onChange={merge} />}
          {step === 2 && <TeamStep        data={data} onChange={merge} />}

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                disabled={loading}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            ) : (
              <span />
            )}

            <Button
              className="ml-auto"
              onClick={handleNext}
              disabled={!canProceed || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLastStep ? 'Finish setup' : (
                <>Next <ArrowRight className="ml-1.5 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Skip link — only shown on non-profile steps */}
        {step > 0 && !isLastStep && (
          <p className="text-center text-xs text-muted-foreground">
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => setStep((s) => s + 1)}
            >
              Skip this step
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
