// @custom — Brand settings page (logo upload + color configuration)
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  Shield,
  CreditCard,
  Activity,
  Save,
  Upload,
  Trash2,
  Palette,
  ArrowLeft,
  Plus,
  Image } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { FormField, Input } from '../../../components/@system/Form/Form'
import { Button } from '../../../components/@system/ui/button'
import { useAuthContext } from '../../../store/@system/auth'
import {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  uploadBrandLogo,
  deleteBrandLogo } from '../../../api/@custom'

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', to: '/app' },
  { icon: Activity, label: 'Activity', to: '/app/activity' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
  { icon: Palette, label: 'Brand', to: '/app/brand' },
]

// ─── Color swatch helper ─────────────────────────────────────────────────────


function ColorPickerField({ label, value, onChange }) {
  const inputRef = useRef(null)

  return (
    <FormField label={label}>
      <div className="flex items-center gap-3">
        {/* Clickable swatch that opens the native color picker */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-10 w-10 rounded-md border border-input shadow-sm flex-shrink-0 transition-transform hover:scale-105"
          style={{ background: value || '#ffffff' }}
          aria-label={`Pick ${label}`}
        />
        <input
          ref={inputRef}
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className="font-mono uppercase"
        />
      </div>
      <p className="text-xs text-muted-foreground">Click the swatch or enter a hex value (e.g. #FF5733)</p>
    </FormField>
  )
}

// ─── Brand list view ─────────────────────────────────────────────────────────


function BrandList({ brands, onSelect, onCreate }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your brand identities.</p>
        </div>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Palette className="mb-4 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No brands yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a brand to configure your logo and colors.</p>
            <Button onClick={onCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create Brand
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => onSelect(brand.id)}
              className="w-full text-left"
            >
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  {/* Logo thumbnail */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border bg-muted overflow-hidden">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-contain" />
                    ) : (
                      <Image className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{brand.name}</p>
                    {brand.description && (
                      <p className="text-sm text-muted-foreground truncate">{brand.description}</p>
                    )}
                  </div>

                  {/* Color swatches */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {brand.primary_color && (
                      <span
                        className="h-5 w-5 rounded-full border border-white shadow"
                        style={{ background: brand.primary_color }}
                        title={`Primary: ${brand.primary_color}`}
                      />
                    )}
                    {brand.secondary_color && (
                      <span
                        className="h-5 w-5 rounded-full border border-white shadow"
                        style={{ background: brand.secondary_color }}
                        title={`Secondary: ${brand.secondary_color}`}
                      />
                    )}
                  </div>

                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    brand.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : brand.status === 'inactive'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {brand.status}
                  </span>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Brand editor ─────────────────────────────────────────────────────────────


function BrandEditor({ brand, isNew, onSaved, onBack }) {
  const [name, setName] = useState(brand?.name ?? '')
  const [description, setDescription] = useState(brand?.description ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(brand?.website_url ?? '')
  const [primaryColor, setPrimaryColor] = useState(brand?.primary_color ?? '#000000')
  const [secondaryColor, setSecondaryColor] = useState(brand?.secondary_color ?? '#ffffff')
  const [logoPreview, setLogoPreview] = useState(brand?.logo_url ?? null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [removingLogo, setRemovingLogo] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1_500_000) {
      setError('Image too large. Please use an image under 1.5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setLogoPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  async function handleLogoUpload() {
    if (!logoPreview || !brand) return
    // Only upload if it's a data URL (changed from what's stored)
    if (!logoPreview.startsWith('data:')) return

    setUploadingLogo(true)
    setError('')
    try {
      const res = await uploadBrandLogo(brand.id, logoPreview)
      setLogoPreview(res.brand.logo_url)
      setSuccess('Logo uploaded successfully!')
      onSaved(res.brand)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleRemoveLogo() {
    if (!brand) return
    setRemovingLogo(true)
    setError('')
    try {
      const res = await deleteBrandLogo(brand.id)
      setLogoPreview(null)
      setSuccess('Logo removed.')
      onSaved(res.brand)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo')
    } finally {
      setRemovingLogo(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      let saved

      if (isNew) {
        const res = await createBrand({
          name,
          description: description || undefined,
          website_url: websiteUrl || undefined,
          primary_color: primaryColor || undefined,
          secondary_color: secondaryColor || undefined })
        saved = res.brand
      } else {
        const res = await updateBrand(brand.id, {
          name,
          description: description || undefined,
          website_url: websiteUrl || undefined,
          primary_color: primaryColor || undefined,
          secondary_color: secondaryColor || undefined })
        saved = res.brand
      }

      // If a new logo was picked, upload it now
      if (logoPreview && logoPreview.startsWith('data:')) {
        try {
          const logoRes = await uploadBrandLogo(saved.id, logoPreview)
          saved = logoRes.brand
        } catch {
          // Logo upload failure is non-fatal here — brand was saved
          setError('Brand saved, but logo upload failed. Try uploading the logo separately.')
        }
      }

      setSuccess(isNew ? 'Brand created!' : 'Brand saved!')
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  const logoChanged = logoPreview !== (brand?.logo_url ?? null)

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to brands
        </button>
        <h1 className="text-2xl font-bold">{isNew ? 'New Brand' : `Edit: ${brand?.name}`}</h1>
        <p className="mt-1 text-muted-foreground">Configure logo, colors, and basic info.</p>
      </div>

      {/* ── Logo upload ─────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Logo</CardTitle>
          <CardDescription>Upload a PNG, JPEG, SVG, or WebP logo. Max 1.5 MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Preview box */}
            <div
              className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted overflow-hidden cursor-pointer transition-colors hover:border-muted-foreground/50"
              onClick={() => fileRef.current?.click()}
              title="Click to upload logo"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Brand logo preview"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                  <Image className="h-7 w-7" />
                  <span className="text-xs">No logo</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Save logo button (only when changed and brand exists) */}
              {logoChanged && !isNew && brand && logoPreview?.startsWith('data:') && (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  onClick={handleLogoUpload}
                  disabled={uploadingLogo}
                >
                  <Save className="h-4 w-4" />
                  {uploadingLogo ? 'Uploading…' : 'Save Logo'}
                </Button>
              )}

              {/* Remove logo */}
              {(brand?.logo_url && !logoChanged) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:bg-destructive/10"
                  onClick={handleRemoveLogo}
                  disabled={removingLogo}
                >
                  <Trash2 className="h-4 w-4" />
                  {removingLogo ? 'Removing…' : 'Remove Logo'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Brand info + colors ─────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Brand Info & Colors</CardTitle>
          <CardDescription>Update your brand name, website, and color palette.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Brand Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </FormField>

            <FormField label="Description">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of your brand"
              />
            </FormField>

            <FormField label="Website URL">
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                type="url"
                placeholder="https://example.com"
              />
            </FormField>

            {/* ── Color palette preview ──────────────────────── */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Palette className="h-4 w-4 text-muted-foreground" />
                Color Palette
              </p>

              <ColorPickerField
                label="Primary Color"
                value={primaryColor}
                onChange={setPrimaryColor}
              />
              <ColorPickerField
                label="Secondary Color"
                value={secondaryColor}
                onChange={setSecondaryColor}
              />

              {/* Live preview strip */}
              {(primaryColor || secondaryColor) && (
                <div className="rounded-md overflow-hidden h-6 flex border">
                  <div className="flex-1" style={{ background: primaryColor || 'transparent' }} />
                  <div className="flex-1" style={{ background: secondaryColor || 'transparent' }} />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : isNew ? 'Create Brand' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function BrandSettingsPage() {
  const { user } = useAuthContext()
  const location = useLocation()

  const [brands, setBrands] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    setLoading(true)
    getBrands()
      .then((res) => setBrands(res.brands))
      .catch((err) => setLoadError(err.message ?? 'Failed to load brands'))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(brand) {
    setBrands((prev) => {
      const idx = prev.findIndex((b) => b.id === brand.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = brand
        return next
      }
      return [brand, ...prev]
    })
    setSelectedId(brand.id)
    setShowNew(false)
  }

  const selectedBrand = brands.find((b) => b.id === selectedId) ?? null
  const isEditing = showNew || selectedId !== null

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
                  active={location.pathname === to || (to === '/app/brand' && location.pathname.startsWith('/app/brand'))}
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

        <main className="flex-1 overflow-auto p-8 max-w-2xl">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              Loading brands…
            </div>
          ) : loadError ? (
            <div className="text-sm text-destructive">{loadError}</div>
          ) : isEditing ? (
            <BrandEditor
              brand={selectedId !== null ? selectedBrand : null}
              isNew={showNew}
              onSaved={handleSaved}
              onBack={() => { setSelectedId(null); setShowNew(false) }}
            />
          ) : (
            <BrandList
              brands={brands}
              onSelect={(id) => { setSelectedId(id); setShowNew(false) }}
              onCreate={() => { setSelectedId(null); setShowNew(true) }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
