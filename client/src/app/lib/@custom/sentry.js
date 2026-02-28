/**
 * Sentry Error Tracking — client-side setup
 *
 * To enable real Sentry SDK:
 *   1. npm install @sentry/react
 *   2. Set VITE_SENTRY_DSN in your .env
 *   3. Uncomment the Sentry.init block below and import * from '@sentry/react'
 *
 * This file currently provides a lightweight wrapper that:
 *  - Sends errors to the internal /api/errors endpoint
 *  - Can be swapped for real Sentry SDK without touching call sites
 */

const DSN = import.meta.env.VITE_ERROR_TRACKING_DSN
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const ENV = import.meta.env.MODE ?? 'development'
const RELEASE = import.meta.env.VITE_APP_VERSION

// ---------------------------------------------------------------------------
// Real Sentry SDK (commented out — uncomment when @sentry/react is installed)
// ---------------------------------------------------------------------------
// import * from '@sentry/react'
// export function initSentry() {
//   if (!import.meta.env.VITE_SENTRY_DSN) return
//   Sentry.init({
//     dsn: import.meta.env.VITE_SENTRY_DSN,
//     environment,
//     release,
//     tracesSampleRate: 0.2,
//   })
// }
// ---------------------------------------------------------------------------

/** Simple fingerprint from error name + first frame of stack */
function fingerprint(err){
  const frame = err.stack?.split('\n')[1]?.trim() ?? ''
  return `${err.name}:${err.message.slice(0, 80)}:${frame.slice(0, 80)}`
}

/** POST an error to our internal ingestion endpoint */
async function ingestError(err, extra) {
  try {
    await fetch(`${API_BASE}/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(DSN ? { 'x-error-dsn': DSN }) },
      body: JSON.stringify({
        fingerprint: fingerprint(err),
        title: `${err.name}: ${err.message}`,
        message: err.message,
        level: 'error',
        platform: 'browser',
        environment,
        release,
        stack_trace: err.stack,
        extra }) })
  } catch {
    // Swallow — never let error tracking throw
  }
}

export const errorTracker = {
  /** Call once at app startup */
  init() {
    window.addEventListener('error', (e) => {
      if (e.error instanceof Error) ingestError(e.error, { type: 'uncaught' })
    })
    window.addEventListener('unhandledrejection', (e) => {
      const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason))
      ingestError(err, { type: 'unhandledRejection' })
    })
  },

  /** Manually capture an exception */
  captureException(err, extra) {
    ingestError(err, extra)
  },

  /** Manually capture a message */
  captureMessage(message, level: 'info' | 'warning' | 'error' = 'info') {
    const err = new Error(message)
    err.name = 'CapturedMessage'
    ingestError(err, { level })
  } }
