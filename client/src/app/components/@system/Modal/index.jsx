// @system — Modal/Dialog component
// Accessible modal with backdrop, animations, and mobile-responsive design
// Mobile-first: Full-height on mobile, centered dialog on desktop
//
// Usage:
// <Modal open={isOpen} onClose={() => setOpen(false)} title="Title">
//   <p>Content</p>
// </Modal>

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { Button } from '../ui/button'

/**
 * Modal — Accessible modal dialog component
 * @param {Object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {string} [props.title] - Modal title
 * @param {string} [props.description] - Modal description
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} [props.footer] - Modal footer content
 * @param {string} [props.size='md'] - Modal size: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} [props.showCloseButton=true] - Show close button
 * @param {boolean} [props.closeOnBackdrop=true] - Close on backdrop click
 * @param {boolean} [props.closeOnEscape=true] - Close on Escape key
 * @param {boolean} [props.fullScreenMobile=false] - Use full screen on mobile devices
 * @param {string} [props.className] - Additional CSS classes
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  fullScreenMobile = false,
  className,
}) {
  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closeOnEscape, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  if (!open) return null

  const sizeClasses = {
    sm: 'w-full sm:max-w-sm',
    md: 'w-full sm:max-w-md',
    lg: 'w-full sm:max-w-lg',
    xl: 'w-full sm:max-w-xl',
    full: 'w-full sm:max-w-full sm:mx-4',
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm animate-in fade-in',
        fullScreenMobile ? 'items-end sm:items-center sm:justify-center sm:p-4' : 'items-center justify-center p-4'
      )}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={cn(
          'relative bg-background shadow-lg animate-in',
          fullScreenMobile
            ? 'h-full w-full rounded-t-xl sm:h-auto sm:rounded-lg slide-in-from-bottom sm:zoom-in-95'
            : 'rounded-lg zoom-in-95 max-h-[90vh] sm:max-h-[85vh]',
          fullScreenMobile ? 'flex flex-col' : '',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn(
            'flex items-start justify-between border-b',
            fullScreenMobile ? 'p-4 sm:p-6' : 'p-4 sm:p-6 pb-3 sm:pb-4'
          )}>
            <div className="flex-1 pr-8">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg sm:text-xl font-semibold leading-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="text-sm text-muted-foreground mt-1.5"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="touch-target rounded-md hover:bg-muted transition-colors shrink-0"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'overflow-y-auto',
          fullScreenMobile ? 'flex-1 p-4 sm:p-6' : 'p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh]'
        )}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={cn(
            'border-t p-4 sm:p-6',
            'flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2'
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ConfirmModal — Pre-configured confirmation modal
 * Mobile-optimized: stacked buttons on mobile, horizontal on desktop
 * @param {Object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm handler
 * @param {string} props.title - Confirmation title
 * @param {string} [props.description] - Confirmation message
 * @param {string} [props.confirmText='Confirm'] - Confirm button text
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {string} [props.variant='default'] - Button variant: 'default', 'destructive'
 * @param {boolean} [props.loading=false] - Loading state
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
    />
  )
}
