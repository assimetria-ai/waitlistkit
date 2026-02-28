import { useMemo } from 'react'



function evaluate(password){
  const requirements = [
    {
      key: 'minLength',
      label: 'At least 8 characters',
      met: password.length >= 8 },
    {
      key: 'longLength',
      label: 'At least 12 characters',
      met: password.length >= 12 },
    {
      key: 'uppercase',
      label: 'One uppercase letter (A–Z)',
      met: /[A-Z]/.test(password) },
    {
      key: 'number',
      label: 'One number (0–9)',
      met: /[0-9]/.test(password) },
    {
      key: 'special',
      label: 'One special character (!@#…)',
      met: /[^A-Za-z0-9]/.test(password) },
  ]

  const score = requirements.filter((r) => r.met).length

  let level
  let label
  let color
  let textColor

  if (score <= 1) {
    level = 'weak'
    label = 'Weak'
    color = 'bg-destructive'
    textColor = 'text-destructive'
  } else if (score === 2) {
    level = 'fair'
    label = 'Fair'
    color = 'bg-orange-400'
    textColor = 'text-orange-500'
  } else if (score === 3) {
    level = 'good'
    label = 'Good'
    color = 'bg-yellow-400'
    textColor = 'text-yellow-600'
  } else {
    level = 'strong'
    label = 'Strong'
    color = 'bg-green-500'
    textColor = 'text-green-600'
  }

  return {
    score,
    level,
    label,
    requirements,
    color,
    textColor,
    percent: Math.round((score / 5) * 100) }
}

export function usePasswordStrength(password){
  return useMemo(() => {
    if (!password) return null
    return evaluate(password)
  }, [password])
}
