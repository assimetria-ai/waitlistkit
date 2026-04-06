// @custom — Splice landing page
// Delegates to @system LandingPage which uses info.name and info.tagline
// from @custom/info.js (Splice branding, color #6366F1)
import { LandingPage as SystemLandingPage } from '../@system/LandingPage'

export function LandingPage() {
  return <SystemLandingPage />
}

export default LandingPage
