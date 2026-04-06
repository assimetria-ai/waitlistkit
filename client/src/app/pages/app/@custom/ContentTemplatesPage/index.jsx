/**
 * @custom ContentTemplatesPage — Browse, manage, and use LinkedIn post templates
 * Categories: thought leadership, product launch, personal branding, hiring
 * Template types: listicles, hot takes, storytelling, how-to, carousel outlines, engagement hooks
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Copy,
  Star,
  StarOff,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Edit3,
  X,
  ChevronDown,
  Layout,
  List,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Users,
  Briefcase,
  Megaphone,
  Heart,
  ArrowRight,
  Tag,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard/DashboardLayout'
import { cn } from '../../../lib/@system/utils'

// ─── Constants ────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layout },
  { id: 'thought-leadership', label: 'Thought Leadership', icon: Sparkles },
  { id: 'product-launch', label: 'Product Launch', icon: Megaphone },
  { id: 'personal-branding', label: 'Personal Branding', icon: Heart },
  { id: 'hiring', label: 'Hiring', icon: Users },
  { id: 'engagement', label: 'Engagement', icon: MessageSquare },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'custom', label: 'My Templates', icon: Bookmark },
]

const TEMPLATE_TYPES = [
  'listicle', 'hot-take', 'storytelling', 'how-to',
  'carousel-outline', 'engagement-hook', 'poll', 'case-study',
]

const TYPE_LABELS = {
  'listicle': 'Listicle',
  'hot-take': 'Hot Take',
  'storytelling': 'Storytelling',
  'how-to': 'How-To',
  'carousel-outline': 'Carousel Outline',
  'engagement-hook': 'Engagement Hook',
  'poll': 'Poll',
  'case-study': 'Case Study',
}

// Brand color: #0891B2 (teal/cyan)
const BRAND = {
  primary: '#0891B2',
  primaryLight: '#ecfeff',
  primaryDark: '#0e7490',
}

// ─── Built-in Templates ──────────────────────────────────────────
const BUILTIN_TEMPLATES = [
  {
    id: 'tpl-1',
    title: 'The Contrarian Take',
    type: 'hot-take',
    category: 'thought-leadership',
    description: 'Challenge conventional wisdom with a bold, well-reasoned opinion.',
    structure: '1. Bold opening statement (contrarian view)\n2. Why most people get it wrong\n3. Your evidence/experience\n4. The real truth\n5. Call to action/question',
    example: 'Unpopular opinion: Most LinkedIn advice is terrible.\n\nHere\'s why...\n\n[Your reasoning]\n\nThe truth is [insight].\n\nAgree or disagree? Drop a comment.',
    tags: ['viral', 'debate', 'authority'],
    isFavorite: false,
    isBuiltin: true,
  },
  {
    id: 'tpl-2',
    title: '5 Lessons Learned',
    type: 'listicle',
    category: 'personal-branding',
    description: 'Share numbered insights from a specific experience or milestone.',
    structure: '1. Hook: What you learned from [experience]\n2. Lesson 1 (with brief explanation)\n3. Lesson 2\n4. Lesson 3\n5. Lesson 4\n6. Lesson 5\n7. Wrap-up + question',
    example: 'I spent 5 years building startups.\n\nHere are 5 things I wish I knew on Day 1:\n\n1. [Lesson]\n2. [Lesson]\n3. [Lesson]\n4. [Lesson]\n5. [Lesson]\n\nWhich resonates most? Comment below.',
    tags: ['listicle', 'personal', 'growth'],
    isFavorite: false,
    isBuiltin: true,
  },
  {
    id: 'tpl-3',
    title: 'Before vs After Story',
    type: 'storytelling',
    category: 'personal-branding',
    description: 'Tell a transformation story that inspires and connects.',
    structure: '1. The "before" state (relatable struggle)\n2. The turning point\n3. What changed\n4. The "after" state (results)\n5. The lesson for others',
    example: '2 years ago, I was [struggle].\n\nThen I discovered [turning point].\n\nSince then:\n- [Result 1]\n- [Result 2]\n- [Result 3]\n\nThe biggest lesson? [Insight]\n\nDon\'t wait to start.',
    tags: ['story', 'transformation', 'inspiration'],
    isFavorite: false,
    isBuiltin: true,
  },
  {
    id: 'tpl-4',
    title: 'Product Launch Announcement',
    type: 'how-to',
    category: 'product-launch',
    description: 'Announce a new product or feature with excitement and clarity.',
    structure: '1. Exciting announcement hook\n2. What problem it solves\n3. Key features (3-5)\n4. Who it\'s for\n5. How to get started\n6. Special offer/CTA',
    example: 'Big news: We just launched [Product]!\n\nAfter months of building, it\'s finally here.\n\nWhat it does:\n- [Feature 1]\n- [Feature 2]\n- [Feature 3]\n\nPerfect for [target audience].\n\nTry it free: [link]',
    tags: ['launch', 'product', 'announcement'],
    isFavorite: false,
    isBuiltin: true,
  },
  {
    id: 'tpl-5',
    title: 'Carousel: Step-by-Step Guide',
    type: 'carousel-outline',
    category: 'thought-leadership',
    description: 'Outline for a visual carousel with actionable steps.',
    structure: 'Slide 1: Title + hook\nSlide 2: The problem\nSlide 3-7: Steps 1-5\nSlide 8: Summary\nSlide 9: CTA (follow/save)',
    example: 'Slide 1: How to [achieve X] in 5 steps\nSlide 2: Most people struggle with [problem]\nSlide 3: Step 1 - [action]\nSlide 4: Step 2 - [action]\n...\nSlide 8: Quick recap\nSlide 9: Follow for more tips like this',
    tags: ['carousel', 'educational', 'save-worthy'],
    isFavorite: false,
    isBuiltin: true,
  },
  {
    id: 'tpl-6',
    title: 'Engagement Question',
    type: 'engagement-hook',
    category: 'engagement',
    description: 'Start a conversation with a thought-provoking question.',
    structure: '1. Context/observation\n2. The question\n3. Your answer (optional)\n4. Invite discussion',
    example: 'I\'ve noticed something interesting about [topic].\n\n[Observation]\n\nMy question: [thought-provoking question]?\n\nI\'ll go first: [your answer]\n\nYour turn in the comments.',
    tags: ['engagement', 'comments', 'discussion'],
    isFavorite: false,
    isBuiltin: true,
  },
  {
    id: 'tpl-7',
    title: 'We\'re Hiring!',
    type: 'engagement-hook',
    category: 'hiring',
    description: 'Attract top talent with an authentic hiring post.',
    structure: '1. We\'re growing!\n2. The role\n3. What makes this special\n4. Culture highlights\n5. How to apply',
    example: 'We\'re hiring a [Role] to join our team!\n\nWhat you\'ll do:\n- [Responsibility 1]\n- [Responsibility 2]\n\nWhy join us:\n- [Perk/culture point]\n- [Growth opportunity]\n\nApply here: [link]\n\nKnow someone perfect? Tag them!',
    tags: ['hiring', 'team', 'culture'],
    isFavorite: false,
    isBuiltin: true,
  },
  {
    id: 'tpl-8',
    title: 'Data-Driven Insight',
    type: 'case-study',
    category: 'growth',
    description: 'Share a surprising data point with analysis and takeaway.',
    structure: '1. The surprising stat/data point\n2. Context: why this matters\n3. Your analysis\n4. What to do about it\n5. Discussion prompt',
    example: '[Stat] of [audience] are doing [something unexpected].\n\nHere\'s what the data shows:\n\n[Analysis]\n\nThe takeaway?\n[Actionable insight]\n\nAre you seeing the same trend?',
    tags: ['data', 'insights', 'authority'],
    isFavorite: false,
    isBuiltin: true,
  },
]

// ─── Component ────────────────────────────────────────────────────
export default function ContentTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeType, setActiveType] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // Load templates
  useEffect(() => {
    const saved = localStorage.getItem('taplio-custom-templates')
    const custom = saved ? JSON.parse(saved) : []
    setTemplates([...BUILTIN_TEMPLATES, ...custom])
  }, [])

  // Save custom templates
  const saveCustomTemplates = useCallback((allTemplates) => {
    const custom = allTemplates.filter(t => !t.isBuiltin)
    localStorage.setItem('taplio-custom-templates', JSON.stringify(custom))
  }, [])

  // Toggle favorite
  const toggleFavorite = useCallback((id) => {
    setTemplates(prev => {
      const next = prev.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t)
      saveCustomTemplates(next)
      return next
    })
  }, [saveCustomTemplates])

  // Delete template
  const deleteTemplate = useCallback((id) => {
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id || t.isBuiltin)
      saveCustomTemplates(next)
      return next
    })
  }, [saveCustomTemplates])

  // Copy template to clipboard
  const copyTemplate = useCallback((template) => {
    const text = `${template.title}\n\n${template.example}`
    navigator.clipboard.writeText(text).catch(() => {})
  }, [])

  // Add custom template
  const addTemplate = useCallback((template) => {
    const newTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      isBuiltin: false,
      isFavorite: false,
    }
    setTemplates(prev => {
      const next = [...prev, newTemplate]
      saveCustomTemplates(next)
      return next
    })
    setShowCreateModal(false)
  }, [saveCustomTemplates])

  // Filtered templates
  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (activeCategory === 'custom' && t.isBuiltin) return false
      if (activeCategory !== 'all' && activeCategory !== 'custom' && t.category !== activeCategory) return false
      if (activeType !== 'all' && t.type !== activeType) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [templates, search, activeCategory, activeType])

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Content Templates</h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse and manage LinkedIn post templates. {filtered.length} template{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: BRAND.primary }}
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': BRAND.primary }}
            />
          </div>
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': BRAND.primary }}
          >
            <option value="all">All Types</option>
            {TEMPLATE_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'grid' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'
              )}
              style={viewMode === 'grid' ? { backgroundColor: BRAND.primary } : {}}
            >
              <Layout size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2.5 transition-colors',
                viewMode === 'list' ? 'text-white' : 'text-slate-500 hover:bg-slate-50'
              )}
              style={viewMode === 'list' ? { backgroundColor: BRAND.primary } : {}}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const active = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  active ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
                style={active ? { backgroundColor: BRAND.primary } : {}}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Templates Grid/List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700">No templates found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or create a new template</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onFavorite={toggleFavorite}
                onCopy={copyTemplate}
                onDelete={deleteTemplate}
                onPreview={(t) => { setSelectedTemplate(t); setShowPreview(true) }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(template => (
              <TemplateListItem
                key={template.id}
                template={template}
                onFavorite={toggleFavorite}
                onCopy={copyTemplate}
                onDelete={deleteTemplate}
                onPreview={(t) => { setSelectedTemplate(t); setShowPreview(true) }}
              />
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && selectedTemplate && (
          <TemplatePreviewModal
            template={selectedTemplate}
            onClose={() => { setShowPreview(false); setSelectedTemplate(null) }}
            onCopy={copyTemplate}
          />
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateTemplateModal
            onClose={() => setShowCreateModal(false)}
            onCreate={addTemplate}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// ─── Template Card ────────────────────────────────────────────────
function TemplateCard({ template, onFavorite, onCopy, onDelete, onPreview }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: BRAND.primaryLight, color: BRAND.primary }}
        >
          <Tag size={10} />
          {TYPE_LABELS[template.type] || template.type}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onFavorite(template.id)}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            {template.isFavorite
              ? <Star size={14} className="text-amber-500 fill-amber-500" />
              : <StarOff size={14} className="text-slate-400" />
            }
          </button>
          <button
            onClick={() => onCopy(template)}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <Copy size={14} className="text-slate-400" />
          </button>
          {!template.isBuiltin && (
            <button
              onClick={() => onDelete(template.id)}
              className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{template.title}</h3>
      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{template.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {template.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">
            {tag}
          </span>
        ))}
      </div>
      <button
        onClick={() => onPreview(template)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border"
        style={{ borderColor: BRAND.primary, color: BRAND.primary }}
      >
        Use Template <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ─── Template List Item ───────────────────────────────────────────
function TemplateListItem({ template, onFavorite, onCopy, onDelete, onPreview }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-slate-900 truncate">{template.title}</h3>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
            style={{ backgroundColor: BRAND.primaryLight, color: BRAND.primary }}
          >
            {TYPE_LABELS[template.type] || template.type}
          </span>
        </div>
        <p className="text-sm text-slate-500 truncate">{template.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onFavorite(template.id)} className="p-2 rounded-md hover:bg-slate-100">
          {template.isFavorite
            ? <Star size={16} className="text-amber-500 fill-amber-500" />
            : <StarOff size={16} className="text-slate-400" />
          }
        </button>
        <button onClick={() => onCopy(template)} className="p-2 rounded-md hover:bg-slate-100">
          <Copy size={16} className="text-slate-400" />
        </button>
        {!template.isBuiltin && (
          <button onClick={() => onDelete(template.id)} className="p-2 rounded-md hover:bg-red-50">
            <Trash2 size={16} className="text-red-400" />
          </button>
        )}
        <button
          onClick={() => onPreview(template)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: BRAND.primary }}
        >
          Use
        </button>
      </div>
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────────────────
function TemplatePreviewModal({ template, onClose, onCopy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{template.title}</h2>
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2"
                style={{ backgroundColor: BRAND.primaryLight, color: BRAND.primary }}
              >
                {TYPE_LABELS[template.type] || template.type}
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-100">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-4">{template.description}</p>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Structure</h4>
            <pre className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4 whitespace-pre-wrap font-sans">
              {template.structure}
            </pre>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Example</h4>
            <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 whitespace-pre-wrap border-l-4"
              style={{ borderColor: BRAND.primary }}
            >
              {template.example}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {template.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onCopy(template)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: BRAND.primary }}
            >
              <Copy size={16} />
              Copy to Clipboard
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Create Template Modal ────────────────────────────────────────
function CreateTemplateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '',
    type: 'listicle',
    category: 'personal-branding',
    description: '',
    structure: '',
    example: '',
    tags: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title || !form.structure) return
    onCreate({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-900">Create Template</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-md hover:bg-slate-100">
              <X size={18} className="text-slate-400" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2"
              placeholder="My Custom Template"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
              >
                {TEMPLATE_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
              >
                {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'custom').map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
              placeholder="Brief description of this template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Structure</label>
            <textarea
              value={form.structure}
              onChange={e => setForm(f => ({ ...f, structure: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-y"
              rows={4}
              placeholder="1. Hook&#10;2. Main point&#10;3. CTA"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Example</label>
            <textarea
              value={form.example}
              onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-y"
              rows={4}
              placeholder="Write an example post using this template..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm"
              placeholder="viral, engagement, story"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: BRAND.primary }}
            >
              Create Template
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
