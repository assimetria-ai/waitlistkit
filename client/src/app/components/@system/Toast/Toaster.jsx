import { ToastProvider, ToastViewport } from '@radix-ui/react-toast'

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
