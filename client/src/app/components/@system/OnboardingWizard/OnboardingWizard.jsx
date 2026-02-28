// @system — First-time user onboarding wizard
// Multi-step wizard shown immediately after registration.
// Steps: Welcome → Use Case → Referral Source → Done
//
// Usage: render <OnboardingWizard /> inside OnboardingPage.
// On completion, calls completeOnboarding() from auth context and navigates to /app.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Rocket,
  Heart,
  Code2,
  Building2,
  Users,
  Megaphone,
  ArrowRight,
  Check } from 'lucide-react'
import { useAuthContext } from '@/app/store/@system/auth'
import { cn } from '@/app/lib/@system/utils'

// ── Types ─────────────────────────────────────────────────────────────────────


// ── Step definitions ──────────────────────────────────────────────────────────

const USE_CASES = [
  { id: 'solo', label: 'Solo project', icon: User },
  { id: 'startup', label: 'Startup', icon: Rocket },
  { id: 'agency', label: 'Agency', icon: Building2 },
  { id: 'enterprise', label: 'Enterprise', icon: Users },
  { id: 'dev', label: 'Developer / OSS', icon: Code2 },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
]

const REFERRAL_SOURCES = [
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'google', label: 'Google search' },
  { id: 'friend', label: 'Friend / colleague' },
  { id: 'producthunt', label: 'Product Hunt' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'other', label: 'Other' },
]

const TOTAL_STEPS = 4

// ── Subcomponents ─────────────────────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i < current
              ? 'bg-primary w-6'
              : i === current
              ? 'bg-primary w-6'
              : 'bg-muted w-2'
          )}
        />
      ))}
    </div>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:pointer-events-none'
      )}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
      ) : null}
      {children}
    </button>
  )
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ data, onChange, onNext, user }) {
  const defaultName = data.name || user?.name || ''
  const [name, setName] = useState(defaultName)

  function handleNext() {
    onChange({ name: name.trim() || user?.name || '' })
    onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome aboard!</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Let's get you set up in under a minute.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="onb-name">
          What should we call you?
        </label>
        <input
          id="onb-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={cn(
            'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'transition-colors'
          )}
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          autoFocus
        />
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={handleNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── Step 2: Use case ──────────────────────────────────────────────────────────

function StepUseCase({
  data,
  onChange,
  onNext }) {
  const [selected, setSelected] = useState(data.useCase)

  function handleSelect(id) {
    setSelected(id)
    onChange({ useCase: id })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">What are you building?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          This helps us tailor the experience for you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {USE_CASES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
              'hover:border-primary/60 hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected === id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-background text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onNext}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <PrimaryButton onClick={onNext} disabled={false}>
          Continue <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── Step 3: Referral source ───────────────────────────────────────────────────

function StepReferral({
  data,
  onChange,
  onNext }) {
  const [selected, setSelected] = useState(data.referralSource)

  function handleSelect(id) {
    setSelected(id)
    onChange({ referralSource: id })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">How did you hear about us?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Totally optional — just helps us improve.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {REFERRAL_SOURCES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all text-left',
              'hover:border-primary/60 hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected === id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-background text-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                selected === id ? 'border-primary bg-primary' : 'border-muted-foreground/40'
              )}
            >
              {selected === id && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </div>
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onNext}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <PrimaryButton onClick={onNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  )
}

// ── Step 4: Done ──────────────────────────────────────────────────────────────

function StepDone({
  onFinish,
  loading,
  userName }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Heart className="h-10 w-10 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          You're all set{userName ? `, ${userName.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
          Your account is ready. Time to explore everything waiting for you.
        </p>
      </div>

      <PrimaryButton onClick={onFinish} loading={loading}>
        Go to dashboard <ArrowRight className="h-4 w-4" />
      </PrimaryButton>
    </div>
  )
}

// ── Wizard container ──────────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0 }),
  center,
  exit: (direction) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0 }) }

export function OnboardingWizard() {
  const { user, completeOnboarding } = useAuthContext()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: user?.name ?? '',
    useCase: '',
    referralSource: '' })

  function patch(partial) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function goNext() {
    setDirection(1)
    setStep((s) => s + 1)
  }

  async function finish() {
    setLoading(true)
    try {
      await completeOnboarding({
        name: data.name || undefined,
        useCase: data.useCase || undefined,
        referralSource: data.referralSource || undefined })
      navigate('/app', { replace: true })
    } catch {
      // If the API fails, still navigate — don't block the user
      navigate('/app', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    <StepWelcome key="welcome" data={data} onChange={patch} onNext={goNext} user={user} />,
    <StepUseCase key="use-case" data={data} onChange={patch} onNext={goNext} />,
    <StepReferral key="referral" data={data} onChange={patch} onNext={goNext} />,
    <StepDone key="done" onFinish={finish} loading={loading} userName={data.name || user?.name || ''} />,
  ]

  return (
    <div className="w-full max-w-lg">
      <StepDots current={step} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
