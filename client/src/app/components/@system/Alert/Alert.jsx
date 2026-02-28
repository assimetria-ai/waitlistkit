// @system — alert / callout component with semantic variants
import { cva } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { useState } from 'react'

const alertVariants = cva(
  'relative flex items-start gap-3 rounded-lg border p-4 text-sm',
  {
    variants: {
      variant },
    defaultVariants }
)

const ICONS = {
  default,
  info,
  success,
  warning,
  destructive }


export function Alert({ className, variant = 'default', title, dismissible, children, ...props }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  const Icon = ICONS[variant ?? 'default']

  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
