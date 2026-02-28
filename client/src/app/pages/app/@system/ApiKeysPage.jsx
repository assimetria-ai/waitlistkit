// @system — API key management page
// Allows users to create and revoke API keys for programmatic access.
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  Shield,
  CreditCard,
  Activity,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { FormField, Input } from '../../../components/@system/Form/Form'
import { Button } from '../../../components/@system/ui/button'
import { Modal } from '../../../components/@system/Modal/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/@system/Table/Table'
import { Badge } from '../../../components/@system/Badge/Badge'
import { useAuthContext } from '../../../store/@system/auth'
import { apiKeysApi } from '../../../lib/@system/apiKeys'
import { ApiKeysPageSkeleton } from '../../../components/@system/Skeleton/Skeleton'

const NAV_ITEMS = [
  { icon, label: 'Dashboard', to: '/app' },
  { icon, label: 'Activity', to: '/app/activity' },
  { icon, label: 'Billing', to: '/app/billing' },
  { icon, label: 'API Keys', to: '/app/api-keys' },
  { icon, label: 'Settings', to: '/app/settings' },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable in non-secure context
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function NewKeySuccessBanner({ rawKey, onDismiss }) {
  return (
    <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-700">Save your API key now</p>
          <p className="mt-0.5 text-xs text-green-600">
            This is the only time it will be shown. Store it somewhere safe.
          </p>
          <div className="mt-3 flex items-center rounded-md border border-green-300 bg-white px-3 py-2 font-mono text-xs break-all">
            <span className="flex-1 select-all">{rawKey}</span>
            <CopyButton text={rawKey} />
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-green-600 underline hover:no-underline"
        >
          Done
        </button>
      </div>
    </div>
  )
}

export function ApiKeysPage() {
  const { user } = useAuthContext()
  const location = useLocation()

  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExpiry, setNewKeyExpiry] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [newRawKey, setNewRawKey] = useState(null)

  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    setLoading(true)
    setError('')
    try {
      const data = await apiKeysApi.list()
      setKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newKeyName.trim()) {
      setCreateError('Name is required')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const result = await apiKeysApi.create({
        name: newKeyName.trim(),
        expiresAt: newKeyExpiry || undefined })
      setKeys((prev) => [result.apiKey, ...prev])
      setNewRawKey(result.rawKey)
      setCreateOpen(false)
      setNewKeyName('')
      setNewKeyExpiry('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await apiKeysApi.revoke(revokeTarget.id)
      setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id))
      setRevokeTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key')
    } finally {
      setRevoking(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric' })
  }

  function isExpired(expiresAt) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
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

        <main className="flex-1 overflow-auto p-8 max-w-4xl">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">API Keys</h1>
              <p className="mt-1 text-muted-foreground">
                Manage API keys for programmatic access to your account.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Key
            </Button>
          </div>

          {/* Success banner — shown after key creation */}
          {newRawKey && (
            <NewKeySuccessBanner rawKey={newRawKey} onDismiss={() => setNewRawKey(null)} />
          )}

          {error && (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Use these keys to authenticate API requests. Keys have access to all endpoints
                available to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ApiKeysPageSkeleton />
              ) : keys.length === 0 ? (
                <div className="py-10 text-center">
                  <Key className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No API keys yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Create your first key
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last used</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {key.key_prefix}…
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(key.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(key.last_used_at)}
                        </TableCell>
                        <TableCell>
                          {key.expires_at ? (
                            isExpired(key.expires_at) ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {formatDate(key.expires_at)}
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setRevokeTarget(key)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Usage hint */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Using an API key</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Pass your key in the <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization</code> header:
              </p>
              <pre className="rounded-md bg-muted px-4 py-3 text-xs overflow-x-auto">
{`curl https://your-app.com/api/users/me \\
  -H "Authorization: Bearer sk_your_key_here"`}
              </pre>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create key modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setNewKeyName('')
          setNewKeyExpiry('')
          setCreateError('')
        }}
        title="Create API Key"
        description="Give your key a descriptive name so you can identify it later."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Key Name">
            <Input
              placeholder="e.g. CI/CD pipeline, Local dev"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              autoFocus
            />
          </FormField>
          <FormField label="Expiry (optional)">
            <Input
              type="date"
              value={newKeyExpiry}
              onChange={(e) => setNewKeyExpiry(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">Leave blank for a non-expiring key.</p>
          </FormField>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create Key'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revoke confirmation modal */}
      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke API Key"
        description={`Are you sure you want to revoke "${revokeTarget?.name}"? Any integrations using this key will stop working immediately.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRevokeTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={revoking}
          >
            {revoking ? 'Revoking…' : 'Revoke Key'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
