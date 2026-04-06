// @system — data table primitives with mobile-responsive padding and overflow
import { cn } from '@/app/lib/@system/utils'

function Table({ className = '', ...props }) {
  return (
    <div className="mobile-table-wrapper">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

function TableHeader({ className = '', ...props }) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}

function TableBody({ className = '', ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableFooter({ className = '', ...props }) {
  return (
    <tfoot
      className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
}

function TableRow({ className = '', ...props }) {
  return (
    <tr
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        // Better touch feedback on mobile
        'active:bg-muted/70',
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className = '', ...props }) {
  return (
    <th
      className={cn(
        // Mobile-responsive padding: smaller on mobile, standard on desktop
        'h-10 sm:h-12 px-3 sm:px-4 text-left align-middle font-medium text-muted-foreground',
        // Responsive text size
        'text-xs sm:text-sm',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className = '', ...props }) {
  return (
    <td
      className={cn(
        // Mobile-responsive padding
        'px-3 py-3 sm:px-4 sm:py-4 align-middle',
        // Responsive text size
        'text-xs sm:text-sm',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className = '', ...props }) {
  return (
    <caption className={cn('mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground', className)} {...props} />
  )
}

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption }

export function ResponsiveTableWrapper({ children, className }) {
  return (
    <div className={cn('w-full overflow-x-auto -mx-4 sm:mx-0', className)}>
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        <div className="overflow-hidden border-y sm:border sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

export function ResponsiveTableCell({ children, className, ...props }) {
  return (
    <td className={cn('px-3 sm:px-4 py-3 sm:py-4 text-sm', className)} {...props}>
      {children}
    </td>
  )
}

export function ResponsiveTableHead({ children, className, ...props }) {
  return (
    <th
      className={cn(
        'px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}
