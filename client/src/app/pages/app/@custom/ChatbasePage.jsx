// @custom — Chatbase integration configuration page
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, Settings, Shield, CreditCard, Activity,
  Bot, Save, Trash2, CheckCircle2, XCircle, Loader2,
  Eye, EyeOff, ExternalLink, Copy, Check } from 'lucide-react'
import { Header } from '@/app/components/@system/Header/Header'
import { Sidebar, SidebarSection, SidebarItem } from '@/app/components/@system/Sidebar/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/@system/Card/Card'
import { FormField, Input } from '@/app/components/@system/Form/Form'
import { Button } from '@/app/components/@system/ui/button'
import { useAuthContext } from '@/app/store/@system/auth'
import { api } from '@/app/lib/@system/api'

const NAV_ITEMS = [
  { icon: Home,     label: 'Dashboard', to: '/app' },
  { icon: Activity, label: 'Activity',  to: '/app/activity' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Settings, label: 'Settings',  to: '/app/settings' },
  { icon: Bot,      label: 'Chatbase',  to: '/app/chatbase' },
]



const defaultConfig = {
  position: 'bottom-right',
  initial_message: 'Hello How can I help you today?',
  theme_color: '#6366f1',
  visibility: 'always' }

export function ChatbasePage() {
  const { user } = useAuthContext()
  const location = useLocation()

  const [settings, setSettings]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [testing, setTesting]         = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [showApiKey, setShowApiKey]   = useState(false)
  const [copied, setCopied]           = useState(false)

  const [chatbotId, setChatbotId]     = useState('')
  const [apiKey, setApiKey]           = useState('')
  const [config, setConfig]           = useState(defaultConfig)

  const [successMsg, setSuccessMsg]   = useState('')
  const [errorMsg, setErrorMsg]       = useState('')
  const [testResult, setTestResult]   = useState(null)

  // ── Load existing settings ────────────────────────────────────────────────
  useEffect(() => {
    api.get('/chatbase/settings')
      .then(({ settings: s }) => {
        if (s) {
          setSettings(s)
          setChatbotId(s.chatbot_id ?? '')
          setConfig({ ...defaultConfig, ...s.config })
        }
      })
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false))
  }, [])

  // ── Save settings ─────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')
    setTestResult(null)
    try {
      const body = { chatbot_id: chatbotId, config }
      if (apiKey) body.api_key = apiKey
      const { settings: updated } = await api.post(
        '/chatbase/settings', body
      )
      setSettings(updated)
      setApiKey('')
      setSuccessMsg('Settings saved successfully.')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  // ── Test connection ───────────────────────────────────────────────────────
  async function handleTest() {
    if (!chatbotId.trim()) {
      setTestResult({ ok: false, message: 'Enter a Chatbot ID first.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const result = await api.post(
        '/chatbase/test', { chatbot_id: chatbotId }
      )
      setTestResult(result)
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Connection test failed.' })
    } finally {
      setTesting(false)
    }
  }

  // ── Delete integration ────────────────────────────────────────────────────
  async function handleDelete() {
    if (!window.confirm('Remove Chatbase integration? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete('/chatbase/settings')
      setSettings(null)
      setChatbotId('')
      setApiKey('')
      setConfig(defaultConfig)
      setSuccessMsg('Integration removed.')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to remove integration.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Copy embed snippet ────────────────────────────────────────────────────
  function copyEmbed() {
    const id = chatbotId || settings?.chatbot_id || ''
    if (!id) return
    const snippet = `<script>
  window.chatbaseConfig = { chatbotId: "${id}" }
</script>
<script
  src="https://www.chatbase.co/embed.min.js"
  id="${id}"
  defer>
</script>`
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const embedId = chatbotId || settings?.chatbot_id || ''

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <Sidebar>
          <div className="mb-6 px-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
          </div>
          <SidebarSection>
            {NAV_ITEMS.map(({ icon, label, to }) => (
              <Link to={to} key={to}>
                <SidebarItem
                  icon={<Icon className="h-4 w-4" />}
                  label={label}
                  active={location.pathname === to}
                />
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/app/admin">
                <SidebarItem
                  icon={<Shield className="h-4 w-4" />}
                  label="Admin"
                  active={location.pathname === '/app/admin'}
                />
              </Link>
            )}
          </SidebarSection>
        </Sidebar>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto p-8 max-w-2xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6" />
                Chatbase Integration
              </h1>
              <p className="mt-1 text-muted-foreground">
                Connect a Chatbase chatbot to your product.
              </p>
            </div>
            {settings?.chatbot_id && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* ── Configuration card ── */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Chatbot Configuration</CardTitle>
                  <CardDescription>
                    Find your Chatbot ID in the{' '}
                    <a
                      href="https://www.chatbase.co/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-1"
                    >
                      Chatbase dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-5">
                    {/* Chatbot ID */}
                    <FormField label="Chatbot ID" required>
                      <div className="flex gap-2">
                        <Input
                          value={chatbotId}
                          onChange={(e) => setChatbotId(e.target.value)}
                          placeholder="e.g. abc123XYZ"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTest}
                          disabled={testing || !chatbotId.trim()}
                          className="shrink-0"
                        >
                          {testing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                      </div>
                      {testResult && (
                        <p className={`text-sm flex items-center gap-1.5 mt-1 ${testResult.ok ? 'text-green-600' : 'text-destructive'}`}>
                          {testResult.ok
                            ? <CheckCircle2 className="h-4 w-4" />
                            : <XCircle className="h-4 w-4" />}
                          {testResult.message}
                        </p>
                      )}
                    </FormField>

                    {/* API Key */}
                    <FormField
                      label="API Key"
                      error={undefined}
                    >
                      <div className="relative">
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={settings?.api_key_set ? '(stored — enter new key to replace)' : 'ck-…'}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optional — required only for conversation analytics queries.
                      </p>
                    </FormField>

                    {/* Widget position */}
                    <FormField label="Widget Position">
                      <select
                        value={config.position}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, position: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                      </select>
                    </FormField>

                    {/* Visibility */}
                    <FormField label="Visibility">
                      <select
                        value={config.visibility}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, visibility: e.target.value }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="always">Always visible</option>
                        <option value="logged-in">Logged-in users only</option>
                        <option value="hidden">Hidden (manual trigger only)</option>
                      </select>
                    </FormField>

                    {/* Initial message */}
                    <FormField label="Initial Message">
                      <Input
                        value={config.initial_message}
                        onChange={(e) =>
                          setConfig((c) => ({ ...c, initial_message: e.target.value }))
                        }
                        placeholder="Hello How can I help you?"
                      />
                    </FormField>

                    {/* Theme colour */}
                    <FormField label="Theme Color">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.theme_color}
                          onChange={(e) =>
                            setConfig((c) => ({ ...c, theme_color: e.target.value }))
                          }
                          className="h-10 w-14 cursor-pointer rounded border border-input bg-background"
                        />
                        <Input
                          value={config.theme_color}
                          onChange={(e) =>
                            setConfig((c) => ({ ...c, theme_color: e.target.value }))
                          }
                          placeholder="#6366f1"
                          className="w-32"
                        />
                      </div>
                    </FormField>

                    {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
                    {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}

                    <div className="flex gap-2 pt-1">
                      <Button type="submit" disabled={saving} className="gap-2">
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saving ? 'Saving…' : 'Save Settings'}
                      </Button>
                      {settings?.chatbot_id && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Remove
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* ── Embed snippet card ── */}
              {embedId && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Embed Snippet</CardTitle>
                    <CardDescription>
                      Paste this into your HTML <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;head&gt;</code> or before the closing{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;body&gt;</code> tag.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative rounded-md bg-muted p-4 font-mono text-xs leading-relaxed">
                      <pre className="whitespace-pre-wrap break-all text-muted-foreground">
{`<script>
  window.chatbaseConfig = { chatbotId: "${embedId}" }
</script>
<script
  src="https://www.chatbase.co/embed.min.js"
  id="${embedId}"
  defer>
</script>`}
                      </pre>
                      <button
                        onClick={copyEmbed}
                        className="absolute top-3 right-3 p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Preview card ── */}
              {embedId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>
                      Preview how the chatbot will appear embedded on your site.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-md border bg-muted" style={{ height: 480 }}>
                      <iframe
                        src={`https://www.chatbase.co/chatbot-iframe/${embedId}`}
                        title="Chatbase Chatbot Preview"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        allow="microphone"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Powered by{' '}
                      <a
                        href="https://www.chatbase.co"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        Chatbase
                      </a>
                      . Actual widget appearance may differ based on your Chatbase plan settings.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
