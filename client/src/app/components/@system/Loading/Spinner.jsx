import { Loader2 } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'


export function Spinner({ className, size = 20 }) {
  return <Loader2 className={cn('animate-spin text-muted-foreground', className)} size={size} />
}
