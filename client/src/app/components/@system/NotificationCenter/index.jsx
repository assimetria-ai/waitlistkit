// @system — Notification Center dropdown
// Bell icon with badge count that opens a dropdown with notification list.
// Supports mark-as-read, mark-all-read, and empty state.

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X, Info, AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { Button } from '../ui/button'

const VARIANT_STYLES = {
  default: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: Check, color: 'text-green-500', bg: 'bg-green-500/10' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  info: { icon: Sparkles, color: 'text-primary', bg: 'bg-primary/10' },
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * NotificationCenter — Bell icon dropdown with notifications
 * @param {Object} props
 * @param {Array} props.notifications - List of notification objects
 * @param {Function} [props.onMarkRead] - Callback when a notification is marked as read
 * @param {Function} [props.onMarkAllRead] - Callback to mark all as read
 * @param {Function} [props.onNotificationClick] - Callback when clicking a notification
 * @param {Function} [props.onDismiss] - Callback to dismiss a notification
 * @param {string} [props.className] - Additional CSS classes
 */
export function NotificationCenter({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onNotificationClick,
  onDismiss,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)
  const unreadCount = notifications.filter((n) => !n.read).length

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-150 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAllRead?.()}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  We'll let you know when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const variant = VARIANT_STYLES[notification.variant] || VARIANT_STYLES.default
                  const Icon = notification.icon || variant.icon

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-accent/50',
                        !notification.read && 'bg-accent/20'
                      )}
                      onClick={() => {
                        onNotificationClick?.(notification)
                        onMarkRead?.(notification.id)
                      }}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          variant.bg
                        )}
                      >
                        <Icon className={cn('h-4 w-4', variant.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm',
                            !notification.read ? 'font-medium' : 'text-muted-foreground'
                          )}
                        >
                          {notification.title}
                        </p>
                        {notification.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notification.description}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-1 shrink-0">
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        )}
                        {onDismiss && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDismiss(notification.id)
                            }}
                            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-0.5"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to full notifications page if it exists
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
