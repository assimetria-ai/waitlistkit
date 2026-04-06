// @system — form field primitives with mobile-optimized inputs
import { Label } from '@radix-ui/react-label'
import { cn } from '@/app/lib/@system/utils'

function FormField({ label, error, required, children, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && <p className="text-xs sm:text-sm text-destructive mt-1">{error}</p>}
    </div>
  )
}

function Input({ className, error, ...props }) {
  return (
    <input
      className={cn(
        // Base styles
        'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background',
        // Mobile-friendly height (min 44px for touch targets)
        'h-11 sm:h-10',
        // File input
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // Placeholder
        'placeholder:text-muted-foreground',
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Disabled states
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Error state
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
  )
}

function Textarea({ className, error, ...props }) {
  return (
    <textarea
      className={cn(
        // Base styles
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background',
        // Placeholder
        'placeholder:text-muted-foreground',
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Disabled states
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Error state
        error && 'border-destructive focus-visible:ring-destructive',
        // Prevent resize on mobile for better UX
        'resize-y sm:resize',
        className
      )}
      {...props}
    />
  )
}

export { FormField, Input, Textarea }

// Simple Form wrapper
function Form({ onSubmit, children, ...props }) {
  return <form onSubmit={onSubmit} {...props}>{children}</form>
}

// Simple FormLabel
function FormLabel({ children, ...props }) {
  return <label className="text-sm font-medium leading-none" {...props}>{children}</label>
}

export { Form, FormLabel }
