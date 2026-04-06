// @system — Multi-step onboarding wizard
// Guides new users through initial setup with a step-by-step flow.
// Tracks progress, allows back/forward navigation, and saves state.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Sparkles, 
  Users, 
  Rocket, 
  ArrowRight, 
  ArrowLeft, 
  Check 
} from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { Button } from '../ui/button'
import { Input } from '../Form'
import { useAuthContext } from '@/app/store/@system/auth'
import { api } from '@/app/lib/@system/api'

// Onboarding steps configuration
const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome! Let\'s get started',
    description: 'Tell us a bit about yourself',
    icon: Sparkles,
  },
  {
    id: 'profile',
    title: 'Complete your profile',
    description: 'Help your team recognize you',
    icon: User,
  },
  {
    id: 'preferences',
    title: 'Set your preferences',
    description: 'Customize your experience',
    icon: Sparkles,
  },
  {
    id: 'invite',
    title: 'Invite your team (optional)',
    description: 'Collaboration is better together',
    icon: Users,
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    description: 'Start exploring your dashboard',
    icon: Rocket,
  },
]

// Step 1: Welcome
function WelcomeStep({ data, onDataChange }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Welcome aboard!</h2>
        <p className="text-muted-foreground">
          We're excited to have you here. Let's take a moment to set up your account.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            What's your full name?
          </label>
          <Input
            value={data.name || ''}
            onChange={(e) => onDataChange({ name: e.target.value })}
            placeholder="John Doe"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            What should we call you?
          </label>
          <Input
            value={data.displayName || ''}
            onChange={(e) => onDataChange({ displayName: e.target.value })}
            placeholder="John"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This is how you'll appear to others
          </p>
        </div>
      </div>
    </div>
  )
}

// Step 2: Profile
function ProfileStep({ data, onDataChange }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Complete your profile</h2>
        <p className="text-muted-foreground">
          Add some details to help your team recognize you
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Job title
          </label>
          <Input
            value={data.jobTitle || ''}
            onChange={(e) => onDataChange({ jobTitle: e.target.value })}
            placeholder="e.g. Product Designer"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Company or organization
          </label>
          <Input
            value={data.company || ''}
            onChange={(e) => onDataChange({ company: e.target.value })}
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Location (optional)
          </label>
          <Input
            value={data.location || ''}
            onChange={(e) => onDataChange({ location: e.target.value })}
            placeholder="e.g. San Francisco, CA"
          />
        </div>
      </div>
    </div>
  )
}

// Step 3: Preferences
function PreferencesStep({ data, onDataChange }) {
  const preferences = [
    {
      id: 'emailNotifications',
      label: 'Email notifications',
      description: 'Receive updates about your account and activity',
    },
    {
      id: 'marketingEmails',
      label: 'Product updates',
      description: 'Get news about new features and improvements',
    },
    {
      id: 'weeklyDigest',
      label: 'Weekly digest',
      description: 'Summary of your weekly activity',
    },
  ]

  const togglePreference = (id) => {
    onDataChange({
      preferences: {
        ...data.preferences,
        [id]: !data.preferences?.[id],
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Set your preferences</h2>
        <p className="text-muted-foreground">
          Customize how you want to stay informed
        </p>
      </div>

      <div className="space-y-3">
        {preferences.map((pref) => (
          <button
            key={pref.id}
            onClick={() => togglePreference(pref.id)}
            className={cn(
              'w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
              data.preferences?.[pref.id]
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40'
            )}
          >
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors mt-0.5',
                data.preferences?.[pref.id]
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/40'
              )}
            >
              {data.preferences?.[pref.id] && (
                <Check className="h-3.5 w-3.5 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{pref.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pref.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Step 4: Invite team
function InviteStep({ data, onDataChange }) {
  const [emails, setEmails] = useState([''])

  const addEmailField = () => {
    setEmails([...emails, ''])
  }

  const updateEmail = (index, value) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
    onDataChange({ invites: newEmails.filter(e => e.trim()) })
  }

  const removeEmail = (index) => {
    const newEmails = emails.filter((_, i) => i !== index)
    setEmails(newEmails.length === 0 ? [''] : newEmails)
    onDataChange({ invites: newEmails.filter(e => e.trim()) })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Invite your team</h2>
        <p className="text-muted-foreground">
          Collaborate better by inviting your teammates
        </p>
      </div>

      <div className="space-y-3">
        {emails.map((email, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              placeholder="teammate@company.com"
              type="email"
            />
            {emails.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeEmail(index)}
                type="button"
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addEmailField}
          className="w-full"
          type="button"
        >
          Add another
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>You can always invite team members later from your settings</p>
      </div>
    </div>
  )
}

// Step 5: Complete
function CompleteStep() {
  return (
    <div className="space-y-6 text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Rocket className="h-10 w-10 text-primary" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">You're all set!</h2>
        <p className="text-muted-foreground">
          Your account is ready. Let's start exploring.
        </p>
      </div>

      <div className="rounded-lg bg-muted/50 p-6 space-y-3">
        <h3 className="font-semibold">What's next?</h3>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary shrink-0" />
            <span>Explore your dashboard and key metrics</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary shrink-0" />
            <span>Customize your profile and settings</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary shrink-0" />
            <span>Invite team members to collaborate</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-primary shrink-0" />
            <span>Check out the help center if you need assistance</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export function OnboardingWizard() {
  const navigate = useNavigate()
  const { updateUser } = useAuthContext()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState({
    name: '',
    displayName: '',
    jobTitle: '',
    company: '',
    location: '',
    preferences: {
      emailNotifications: true,
      marketingEmails: false,
      weeklyDigest: false,
    },
    invites: [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentStep = STEPS[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1

  const handleDataChange = (updates) => {
    setData((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete()
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    setError('')

    try {
      // Save onboarding data
      await api.patch('/users/me/onboarding', {
        ...data,
        onboardingCompleted: true,
      })

      // Update auth context
      await updateUser({ onboardingCompleted: true })

      // Send invitations if any
      if (data.invites && data.invites.length > 0) {
        try {
          await api.post('/teams/invites', {
            emails: data.invites,
          })
        } catch (err) {
          // Don't block completion if invites fail
          console.error('Failed to send invites:', err)
        }
      }

      // Navigate to app
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding')
      setSaving(false)
    }
  }

  const handleSkip = async () => {
    setSaving(true)
    try {
      await api.patch('/users/me/onboarding', {
        onboardingCompleted: true,
      })
      await updateUser({ onboardingCompleted: true })
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip onboarding')
      setSaving(false)
    }
  }

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep data={data} onDataChange={handleDataChange} />
      case 'profile':
        return <ProfileStep data={data} onDataChange={handleDataChange} />
      case 'preferences':
        return <PreferencesStep data={data} onDataChange={handleDataChange} />
      case 'invite':
        return <InviteStep data={data} onDataChange={handleDataChange} />
      case 'complete':
        return <CompleteStep />
      default:
        return null
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStepIndex
          const isComplete = index < currentStepIndex

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isActive && !isComplete && 'border-primary bg-primary/10 text-primary',
                  !isActive && !isComplete && 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-12 mx-2 transition-all',
                    isComplete ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">{renderStepContent()}</div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {!isFirstStep && !isLastStep && (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={saving}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isLastStep && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={saving}
            >
              Skip for now
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={saving}
            className="gap-2"
          >
            {isLastStep ? (
              <>
                {saving ? 'Completing...' : 'Go to Dashboard'}
                <Rocket className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
