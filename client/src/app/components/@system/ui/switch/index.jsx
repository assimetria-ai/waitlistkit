import * as React from 'react'
import { cn } from '@/app/lib/@system/utils'


export function Switch({ checked, onCheckedChange, disabled = false, id, className }) {
  return (
    <button
      id={id}
      role="switch"
      type="button"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        // Mobile-first: larger switch for touch (44px height) → desktop: original size
        'relative inline-flex h-11 w-20 sm:h-6 sm:w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'touch-target', // WCAG 2.5.5 compliant touch target
        checked ? 'bg-primary' : 'bg-input',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-9 w-9 sm:h-5 sm:w-5 rounded-full bg-background shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-9 sm:translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}
