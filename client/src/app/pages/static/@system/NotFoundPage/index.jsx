import { Link } from 'react-router-dom'
import { Button } from '../../../components/@system/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-muted-foreground">Page not found</p>
      <Link to="/" className="mt-8">
        <Button variant="outline">Go Home</Button>
      </Link>
    </div>
  )
}
