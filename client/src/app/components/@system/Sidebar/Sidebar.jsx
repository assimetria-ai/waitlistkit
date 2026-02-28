// @system — app sidebar layout component
import { Link } from 'react-router-dom'
import { cn } from '@/app/lib/@system/utils'




function Sidebar({ children, className }) {
  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r bg-background px-3 py-4',
        className
      )}
    >
      {children}
    </aside>
  )
}

function SidebarLogo({ name, href = '/app', className }) {
  return (
    <div className={cn('mb-6 px-3', className)}>
      <Link
        to={href}
        className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
      >
        <span className="font-bold text-base tracking-tight">{name}</span>
      </Link>
    </div>
  )
}

function SidebarSection({ children, className }) {
  return <div className={cn('flex flex-col gap-1', className)}>{children}</div>
}

function SidebarItem({ icon, label, active, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
    >
      {icon}
      {label}
    </button>
  )
}

export { Sidebar, SidebarLogo, SidebarSection, SidebarItem }
