// @system — Metric/Stats Card component
// Display key metrics with trend indicators and sparklines
//
// Usage:
// <MetricCard
//   title="Total Revenue"
//   value="$45,231"
//   change={12.5}
//   trend="up"
// />

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'
import { Card } from '../Card'

/**
 * MetricCard — Stats/metrics display card
 * @param {Object} props
 * @param {string} props.title - Metric title
 * @param {string|number} props.value - Current value
 * @param {number} [props.change] - Percentage change
 * @param {string} [props.trend] - Trend direction: 'up', 'down', 'neutral'
 * @param {string} [props.period] - Time period (e.g., 'vs last month')
 * @param {React.ReactNode} [props.icon] - Leading icon
 * @param {string} [props.description] - Additional description
 * @param {boolean} [props.loading=false] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 */
export function MetricCard({
  title,
  value,
  change,
  trend,
  period = 'vs last month',
  icon,
  description,
  loading = false,
  className,
}) {
  // Determine trend from change if not provided
  const determinedTrend = trend || (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral')

  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    down: {
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600',
      bg: 'bg-gray-50 dark:bg-gray-950',
    },
  }

  const config = trendConfig[determinedTrend] || trendConfig.neutral
  const TrendIcon = config.icon

  if (loading) {
    return (
      <Card className={cn('p-4 sm:p-6', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
          <div className="h-6 sm:h-8 bg-muted rounded w-3/4" />
          <div className="h-2 sm:h-3 bg-muted rounded w-1/3" />
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('p-4 sm:p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2 truncate">
            {title}
          </p>

          {/* Value */}
          <p className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 break-words">
            {value}
          </p>

          {/* Change indicator */}
          {change !== undefined && (
            <div className="flex items-center gap-1 text-xs sm:text-sm flex-wrap">
              <span className={cn('flex items-center gap-1 font-medium', config.color)}>
                <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                {Math.abs(change)}%
              </span>
              <span className="text-muted-foreground">{period}</span>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-muted-foreground mt-1 sm:mt-2 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div className={cn('p-2 sm:p-3 rounded-full shrink-0', config.bg)}>
            <div className={cn(config.color, 'w-4 h-4 sm:w-5 sm:h-5')}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * MetricGroup — Grid of metric cards
 * @param {Object} props
 * @param {React.ReactNode} props.children - MetricCard components
 * @param {number} [props.columns=3] - Number of columns (1-4)
 * @param {string} [props.className] - Additional CSS classes
 */
export function MetricGroup({
  children,
  columns = 3,
  className,
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns] || gridCols[3], className)}>
      {children}
    </div>
  )
}

/**
 * CompactMetric — Inline metric display
 * @param {Object} props
 * @param {string} props.label - Metric label
 * @param {string|number} props.value - Metric value
 * @param {number} [props.change] - Percentage change
 * @param {string} [props.className] - Additional CSS classes
 */
export function CompactMetric({
  label,
  value,
  change,
  className,
}) {
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
      {change !== undefined && (
        <span className={cn('flex items-center gap-0.5 text-xs', trendColor)}>
          <TrendIcon className="h-3 w-3" />
          {Math.abs(change)}%
        </span>
      )}
    </div>
  )
}
