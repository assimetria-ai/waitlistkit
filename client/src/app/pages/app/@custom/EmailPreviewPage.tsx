// @custom — email template preview page (admin only)
// Fetches template names from GET /api/email-logs/preview and renders each
// template inside an iframe using GET /api/email-logs/preview/:template

import { useEffect, useRef, useState } from 'react'
import { Mail, Eye, RefreshCw, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '../../../components/@system/Header/Header'
import { PageLayout } from '../../../components/@system/layout/PageLayout'
import { cn } from '../../../lib/@system/utils'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

const TEMPLATE_LABELS: Record<string, string> = {
  verification: 'Email Verification',
  welcome: 'Welcome',
  password_reset: 'Password Reset',
  invitation: 'Team Invitation',
  magic_link: 'Magic Link',
  notification: 'Notification',
}

function templateLabel(key: string): string {
  return TEMPLATE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmailPreviewPage() {
  const [templateNames, setTemplateNames] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [iframeKey, setIframeKey] = useState(0) // bump to force reload
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  async function fetchTemplateList() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/email-logs/preview`, { credentials: 'include' })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const data = await res.json()
      const names: string[] = data.templates ?? []
      setTemplateNames(names)
      if (names.length > 0 && !selected) setSelected(names[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplateList()
  }, [])

  function previewUrl(name: string) {
    return `${BASE_URL}/email-logs/preview/${name}`
  }

  function reload() {
    setIframeKey((k) => k + 1)
  }

  return (
    <PageLayout>
      <Header />
      <main className="container py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/app/emails"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Email Tracking
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Email Template Preview
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Preview every transactional email template as it would appear in the inbox
            </p>
          </div>
          <button
            onClick={reload}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar: template selector */}
          <aside className="w-52 shrink-0">
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              Templates
            </p>
            {loading ? (
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <nav className="space-y-0.5">
                {templateNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => { setSelected(name); setIframeKey((k) => k + 1) }}
                    className={cn(
                      'w-full text-left flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      selected === name
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {templateLabel(name)}
                  </button>
                ))}
              </nav>
            )}
          </aside>

          {/* Preview pane */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <div className="flex flex-col gap-3">
                {/* Template name + open-in-tab link */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {templateLabel(selected)}
                  </span>
                  <a
                    href={previewUrl(selected)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Open in new tab
                  </a>
                </div>

                {/* iframe */}
                <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-[#f3f4f6]">
                  <iframe
                    key={iframeKey}
                    ref={iframeRef}
                    src={previewUrl(selected)}
                    title={`Preview: ${templateLabel(selected)}`}
                    className="w-full"
                    style={{ height: '640px', border: 'none' }}
                    sandbox="allow-same-origin"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Rendered with fixture data. Actual emails use real user names and one-time tokens.
                </p>
              </div>
            ) : (
              !loading && (
                <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-border text-muted-foreground gap-2">
                  <Mail className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Select a template to preview</p>
                </div>
              )
            )}
          </div>
        </div>

      </main>
    </PageLayout>
  )
}
