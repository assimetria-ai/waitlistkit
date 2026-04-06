// @system — Recent activity feed component
// Display a chronological list of user activities with icons and timestamps
//
// Usage:
// <RecentActivityList
//   items={[
//     {
//       id: 1,
//       icon: User,
//       title: 'Profile updated',
//       description: 'You changed your email address',
//       timestamp: '2024-03-07T10:30:00Z',
//       variant: 'default'
//     }
//   ]}
//   emptyMessage="No recent activity"
// />

import { formatDistanceToNow } from 'date-fns'
import { Activity } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { EmptyState } from '../EmptyState'

/**
 * @typedef {'default' | 'success' | 'warning' | 'error'} ActivityVariant
 */

/**
 * @typedef {Object} ActivityItem
 * @property {string | number} id - Unique identifier
 * @property {React.ComponentType} icon - Lucide icon component
 * @property {string} title - Activity title
 * @property {string} [description] - Optional description
 * @property {string} timestamp - ISO timestamp
 * @property {ActivityVariant} [variant='default'] - Visual variant
 * @property {() => void} [onClick] - Optional click handler
 */

const variantStyles = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-500',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-500',
  error: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500',
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted relative time (e.g., "2 hours ago")
 */
function formatTimestamp(timestamp) {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return 'Unknown time'
  }
}

/**
 * RecentActivityList — Display a list of recent activities
 * @param {Object} props
 * @param {ActivityItem[]} props.items - Array of activity items
 * @param {string} [props.emptyMessage='No recent activity'] - Message when no items
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.loading] - Show loading state
 * @param {number} [props.maxItems] - Maximum items to display
 */
export function RecentActivityList({
  items,
  emptyMessage = 'No recent activity',
  className,
  loading = false,
  maxItems,
}) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title={emptyMessage}
        description="Events will appear here once you start using the app."
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {displayItems.map((item) => (
        <ActivityListItem key={item.id} item={item} />
      ))}
      {maxItems && items.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          and {items.length - maxItems} more...
        </p>
      )}
    </div>
  )
}

/**
 * ActivityListItem — Single activity item
 * @private
 */
function ActivityListItem({ item }) {
  const {
    icon: Icon,
    title,
    description,
    timestamp,
    variant = 'default',
    onClick,
  } = item

  const itemContent = (
    <>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          variantStyles[variant]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimestamp(timestamp)}
        </p>
      </div>
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-start gap-3 w-full text-left p-3 rounded-lg',
          'hover:bg-accent transition-colors'
        )}
      >
        {itemContent}
      </button>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3">
      {itemContent}
    </div>
  )
}

/**
 * RecentActivityList.Compact — Compact variant for sidebars or smaller spaces
 * @param {Object} props
 * @param {ActivityItem[]} props.items - Array of activity items
 * @param {string} [props.className] - Additional CSS classes
 */
RecentActivityList.Compact = function CompactActivityList({ items, className }) {
  if (!items || items.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      {items.slice(0, 5).map((item) => (
        <div key={item.id} className="flex items-center gap-2 text-xs">
          <div
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded',
              variantStyles[item.variant || 'default']
            )}
          >
            {item.icon && <item.icon className="h-3 w-3" />}
          </div>
          <p className="flex-1 truncate">{item.title}</p>
          <span className="text-muted-foreground">
            {formatTimestamp(item.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}
