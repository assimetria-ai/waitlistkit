// @system — Security settings component
// Manage password, 2FA, sessions, and API keys

import { useState } from 'react'
import { Lock, Key, Smartphone, Monitor, AlertTriangle, Check, X } from 'lucide-react'
import { SettingsSection, SettingsRow } from './UserSettings'
import { Button } from '../Button'
import { Form, FormField, FormLabel, Input } from '../Form'
import { Badge } from '../Badge'
import { cn } from '@/app/lib/@system/utils'

export function SecuritySettings({ user, onUpdate }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false)
  const [activeSessions] = useState([
    {
      id: 1,
      device: 'Chrome on macOS',
      location: 'San Francisco, CA',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      lastActive: '1 hour ago',
      current: false,
    },
  ])

  return (
    <div className="max-w-2xl">
      {/* Password */}
      <SettingsSection
        title="Password"
        description="Change your password regularly to keep your account secure"
      >
        {!showPasswordForm ? (
          <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
            <Lock className="h-4 w-4 mr-2" />
            Change password
          </Button>
        ) : (
          <PasswordChangeForm onCancel={() => setShowPasswordForm(false)} />
        )}
      </SettingsSection>

      {/* Two-factor authentication */}
      <SettingsSection
        title="Two-factor authentication"
        description="Add an extra layer of security to your account"
      >
        <div className="space-y-4">
          <SettingsRow
            label="Authenticator app"
            description="Use an app like Google Authenticator or Authy"
          >
            {twoFactorEnabled ? (
              <Badge variant="success">
                <Check className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open 2FA setup modal
                  setTwoFactorEnabled(true)
                }}
              >
                Enable
              </Button>
            )}
          </SettingsRow>

          {twoFactorEnabled && (
            <div className="rounded-lg border p-4 bg-accent/50">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Two-factor authentication is active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll need to enter a code from your authenticator app when you sign in
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setTwoFactorEnabled(false)}
                  >
                    Disable 2FA
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Active sessions */}
      <SettingsSection
        title="Active sessions"
        description="Manage devices where you're currently logged in"
      >
        <div className="space-y-3">
          {activeSessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </SettingsSection>

      {/* Security recommendations */}
      <SettingsSection
        title="Security recommendations"
        description="Improve your account security"
      >
        <SecurityChecklist user={user} twoFactorEnabled={twoFactorEnabled} />
      </SettingsSection>
    </div>
  )
}

function PasswordChangeForm({ onCancel }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      // await changePassword(formData)
      onCancel()
    } catch (error) {
      setErrors({ general: 'Failed to change password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="space-y-4">
      <FormField>
        <FormLabel htmlFor="currentPassword">Current password</FormLabel>
        <Input
          id="currentPassword"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          required
        />
      </FormField>

      <FormField>
        <FormLabel htmlFor="newPassword">New password</FormLabel>
        <Input
          id="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          required
        />
        {errors.newPassword && (
          <p className="text-xs text-destructive mt-1">{errors.newPassword}</p>
        )}
      </FormField>

      <FormField>
        <FormLabel htmlFor="confirmPassword">Confirm new password</FormLabel>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
        )}
      </FormField>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Change password
        </Button>
      </div>
    </Form>
  )
}

function SessionCard({ session }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Monitor className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{session.device}</p>
            {session.current && (
              <Badge variant="success" className="text-xs">Current</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{session.location}</p>
          <p className="text-xs text-muted-foreground">Active {session.lastActive}</p>
        </div>
      </div>
      {!session.current && (
        <Button variant="ghost" size="sm">
          Revoke
        </Button>
      )}
    </div>
  )
}

function SecurityChecklist({ user, twoFactorEnabled }) {
  const checks = [
    {
      id: 'strong-password',
      label: 'Use a strong password',
      completed: true,
      description: 'Your password meets security requirements',
    },
    {
      id: '2fa',
      label: 'Enable two-factor authentication',
      completed: twoFactorEnabled,
      description: 'Add an extra layer of security',
    },
    {
      id: 'email-verified',
      label: 'Verify your email',
      completed: user?.emailVerified || false,
      description: 'Confirm your email address',
    },
  ]

  return (
    <div className="space-y-2">
      {checks.map((check) => (
        <div
          key={check.id}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg border',
            check.completed ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900' : 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900'
          )}
        >
          {check.completed ? (
            <Check className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{check.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{check.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
