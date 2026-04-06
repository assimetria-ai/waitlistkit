// @system — Reusable stat/metric card for dashboards
// Display a key metric with optional trend indicator and action button
//
// Usage:
// <StatCard
//   label="Total Users"
//   value="1,234"
//   trend={{ value: 12, direction: 'up' }}
//   description="vs last month"
//   icon={Users}
//   action={{ label: 'View all', onClick: () => {} }}
// />

import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { Card, CardContent, CardHeader, CardDescription } from '../Card'

/**
 * @typedef {Object} Trend
 * @property {number} value - Percentage change
 * @property {'up' | 'down'} direction - Trend direction
 */

/**
 * @typedef {Object} Action
 * @property {string} label - Action button text
 * @property {() => void} onClick - Click handler
 */

/**
 * @typedef {Object} StatCardProps
 * @property {string} label - Metric label (e.g., "Total Revenue")
 * @property {string | number} value - Main metric value
 * @property {string} [description] - Optional description (e.g., "vs last month")
 * @property {Trend} [trend] - Optional trend indicator
 * @property {React.ComponentType} [icon] - Optional Lucide icon component
 * @property {Action} [action] - Optional action button
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [loading] - Show loading state
 */

export function StatCard({
  label,
  value,
  description,
  trend,
  icon: Icon,
  action,
  className,
  loading = false,
}) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-2">
          <div className="h-4 w-24 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted rounded mb-2" />
          <div className="h-3 w-32 bg-muted rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <CardDescription className="font-medium">{label}</CardDescription>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                trend.direction === 'up' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * StatCardGrid — Responsive grid container for StatCards
 * @param {Object} props
 * @param {React.ReactNode} props.children - StatCard components
 * @param {string} [props.className] - Additional CSS classes
 */
export function StatCardGrid({ children, className, ...rest }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6', className)} {...rest}>
      {children}
    </div>
  )
}
