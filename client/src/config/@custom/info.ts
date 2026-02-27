// @custom — WaitlistKit product config
import type { info as SystemInfo } from '../@system/info'

export const customInfo: Partial<typeof SystemInfo> = {
  name: 'WaitlistKit',
  tagline: 'Your runway starts here.',
  url: import.meta.env.VITE_APP_URL ?? 'https://waitlistkit.com',
  supportEmail: 'support@waitlistkit.com',
}
