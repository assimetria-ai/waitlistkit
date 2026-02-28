import { Check, X } from 'lucide-react'
import { usePasswordStrength } from '../../hooks/@custom/usePasswordStrength'

// 4-segment bar that fills as score increases
function StrengthBar({ score, color }) {
  const filled = Math.min(Math.ceil((score / 5) * 4), 4)
  return (
    <div className="flex gap-1" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={5}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i <= filled ? color : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}) {
  const strength = usePasswordStrength(password)

  if (!strength) return null

  return (
    <div className="mt-2 space-y-2">
      {/* Bar + label */}
      <div className="space-y-1">
        <StrengthBar score={strength.score} color={strength.color} />
        <p className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</p>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <ul className="space-y-0.5" aria-label="Password requirements">
          {strength.requirements.map((req) => (
            <li key={req.key} className="flex items-center gap-1.5">
              {req.met ? (
                <Check className="h-3 w-3 text-green-500 shrink-0" aria-hidden />
              ) : (
                <X className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
              )}
              <span
                className={`text-xs transition-colors duration-200 ${
                  req.met ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
