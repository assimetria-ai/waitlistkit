/**
 * @custom HashtagResearchPage — Analyze top performing LinkedIn hashtags
 * Browse by industry/topic, view reach & engagement, trending status,
 * get suggestions for posts, track performance, save hashtag sets.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Hash,
  Search,
  TrendingUp,
  Filter,
  Plus,
  X,
  Star,
  BarChart3,
  Copy,
  Check,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowUpDown,
  Eye,
  Heart,
  Folder,
  Trash2,
  Edit3,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard/DashboardLayout'
import { cn } from '../../../lib/@system/utils'
import { useHashtagResearch } from '../../../hooks/@custom/useHashtagResearch'

// ─── Formatting helpers ───────────────────────────────────────────
function formatNumber(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatEngagement(rate) {
  return `${parseFloat(rate || 0).toFixed(1)}%`
}

// ─── Badge component ─────────────────────────────────────────────
function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    trending: 'bg-amber-100 text-amber-700',
    success: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── HashtagCard ─────────────────────────────────────────────────
function HashtagCard({ hashtag, selected, onSelect, onCopy, copied }) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer',
        selected ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'
      )}
      onClick={() => onSelect(hashtag)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Hash className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="font-semibold text-sm truncate">{hashtag.tag}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hashtag.trending && (
            <Badge variant="trending">
              <TrendingUp className="h-3 w-3" />
              Trending
            </Badge>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(hashtag.tag) }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 transition-all"
            title="Copy hashtag"
          >
            {copied === hashtag.tag ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-slate-400">Reach</div>
          <div className="font-semibold text-slate-700">{formatNumber(hashtag.reach)}</div>
        </div>
        <div>
          <div className="text-slate-400">Engagement</div>
          <div className="font-semibold text-slate-700">{formatEngagement(hashtag.engagement_rate)}</div>
        </div>
        <div>
          <div className="text-slate-400">Posts</div>
          <div className="font-semibold text-slate-700">{formatNumber(hashtag.post_count)}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {hashtag.industry && <Badge>{hashtag.industry}</Badge>}
        {hashtag.topic && hashtag.topic !== hashtag.industry && (
          <Badge variant="info">{hashtag.topic}</Badge>
        )}
      </div>
    </div>
  )
}

// ─── SaveSetModal ────────────────────────────────────────────────
function SaveSetModal({ open, onClose, onSave, selectedHashtags }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Save Hashtag Set</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Set Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., AI & Tech"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Best hashtags for AI content"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-slate-500">
            {selectedHashtags.length} hashtag{selectedHashtags.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedHashtags.map(h => (
              <Badge key={h.id} variant="info">#{h.tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => { onSave({ name, description, hashtag_ids: selectedHashtags.map(h => h.id) }); setName(''); setDescription('') }}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Save Set
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SetCard ─────────────────────────────────────────────────────
function SetCard({ set, onView, onDelete }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <h4 className="font-medium text-sm truncate">{set.name}</h4>
          </div>
          {set.description && <p className="text-xs text-slate-500 mt-1 truncate">{set.description}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge>{set.hashtag_count || 0} tags</Badge>
          <button onClick={() => onDelete(set.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <button
        onClick={() => onView(set)}
        className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        View Hashtags
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════════
export function HashtagResearchPage() {
  const { fetchHashtags, fetchSets, fetchSet, saveSet, deleteSet, fetchSuggestions } = useHashtagResearch()

  // ─── State ────────────────────────────────────────────────────
  const [hashtags, setHashtags] = useState([])
  const [total, setTotal] = useState(0)
  const [industries, setIndustries] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [trendingOnly, setTrendingOnly] = useState(false)
  const [sortBy, setSortBy] = useState('reach')
  const [sortOrder, setSortOrder] = useState('desc')

  // Selection & sets
  const [selectedHashtags, setSelectedHashtags] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [sets, setSets] = useState([])
  const [activeTab, setActiveTab] = useState('browse') // browse | sets | suggest
  const [copied, setCopied] = useState(null)

  // Suggestions
  const [suggestQuery, setSuggestQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)

  // ─── Fetch hashtags ───────────────────────────────────────────
  const loadHashtags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHashtags({
        search,
        industry: industryFilter,
        topic: topicFilter,
        trending: trendingOnly,
        sort: sortBy,
        order: sortOrder,
      })
      setHashtags(data.hashtags || [])
      setTotal(data.total || 0)
      setIndustries(data.industries || [])
      setTopics(data.topics || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchHashtags, search, industryFilter, topicFilter, trendingOnly, sortBy, sortOrder])

  useEffect(() => { loadHashtags() }, [loadHashtags])

  // ─── Fetch sets ───────────────────────────────────────────────
  const loadSets = useCallback(async () => {
    try {
      const data = await fetchSets()
      setSets(data.sets || [])
    } catch (err) {
      // Silently fail for unauthenticated users
    }
  }, [fetchSets])

  useEffect(() => { loadSets() }, [loadSets])

  // ─── Handlers ─────────────────────────────────────────────────
  const handleSelect = (hashtag) => {
    setSelectedHashtags(prev => {
      const exists = prev.find(h => h.id === hashtag.id)
      if (exists) return prev.filter(h => h.id !== hashtag.id)
      return [...prev, hashtag]
    })
  }

  const handleCopy = async (tag) => {
    try {
      await navigator.clipboard.writeText(`#${tag}`)
      setCopied(tag)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const handleCopyAll = async () => {
    if (selectedHashtags.length === 0) return
    const text = selectedHashtags.map(h => `#${h.tag}`).join(' ')
    try {
      await navigator.clipboard.writeText(text)
      setCopied('__all__')
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const handleSaveSet = async (data) => {
    try {
      await saveSet(data)
      setShowSaveModal(false)
      setSelectedHashtags([])
      loadSets()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteSet = async (id) => {
    if (!confirm('Delete this hashtag set?')) return
    try {
      await deleteSet(id)
      loadSets()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSuggest = async () => {
    if (!suggestQuery.trim()) return
    setSuggestLoading(true)
    try {
      const data = await fetchSuggestions(suggestQuery)
      setSuggestions(data.hashtags || [])
    } catch (err) {
      setSuggestions([])
    } finally {
      setSuggestLoading(false)
    }
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <DashboardLayout.Header
        title="Hashtag Research"
        description="Analyze top performing LinkedIn hashtags by industry and topic"
        actions={
          selectedHashtags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">{selectedHashtags.length} selected</span>
              <button
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border hover:bg-slate-50"
              >
                {copied === '__all__' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                Copy All
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <Bookmark className="h-3.5 w-3.5" />
                Save Set
              </button>
              <button
                onClick={() => setSelectedHashtags([])}
                className="p-1.5 rounded hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        }
      />

      <DashboardLayout.Content>
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
          {[
            { key: 'browse', label: 'Browse', icon: Hash },
            { key: 'suggest', label: 'Suggestions', icon: Sparkles },
            { key: 'sets', label: 'Saved Sets', icon: Folder },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.key === 'sets' && sets.length > 0 && (
                <Badge variant="info">{sets.length}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search hashtags..."
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={industryFilter}
                onChange={e => setIndustryFilter(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Industries</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>

              <select
                value={topicFilter}
                onChange={e => setTopicFilter(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Topics</option>
                {topics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <button
                onClick={() => setTrendingOnly(!trendingOnly)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm transition-colors',
                  trendingOnly ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Trending
              </button>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
              <span>Sort by:</span>
              {[
                { key: 'reach', label: 'Reach' },
                { key: 'engagement_rate', label: 'Engagement' },
                { key: 'post_count', label: 'Posts' },
                { key: 'tag', label: 'Name' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded transition-colors',
                    sortBy === s.key ? 'bg-slate-100 text-slate-700 font-medium' : 'hover:bg-slate-50'
                  )}
                >
                  {s.label}
                  {sortBy === s.key && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </button>
              ))}
              <span className="ml-auto">{total} hashtag{total !== 1 ? 's' : ''}</span>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-3 bg-slate-200 rounded" />
                      <div className="h-3 bg-slate-200 rounded" />
                      <div className="h-3 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hashtags.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Hash className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium">No hashtags found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {hashtags.map(h => (
                  <HashtagCard
                    key={h.id}
                    hashtag={h}
                    selected={selectedHashtags.some(s => s.id === h.id)}
                    onSelect={handleSelect}
                    onCopy={handleCopy}
                    copied={copied}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggest' && (
          <div>
            <div className="max-w-lg mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What's your post about?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={suggestQuery}
                    onChange={e => setSuggestQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSuggest()}
                    placeholder="e.g., AI, leadership, marketing..."
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSuggest}
                  disabled={suggestLoading || !suggestQuery.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {suggestLoading ? 'Searching...' : 'Suggest'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter a topic or keyword to find relevant hashtags sorted by engagement rate
              </p>
            </div>

            {suggestions.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-700">
                    Suggested hashtags for "{suggestQuery}"
                  </h3>
                  <button
                    onClick={() => {
                      const text = suggestions.map(h => `#${h.tag}`).join(' ')
                      navigator.clipboard.writeText(text)
                      setCopied('__suggest__')
                      setTimeout(() => setCopied(null), 2000)
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border hover:bg-slate-50"
                  >
                    {copied === '__suggest__' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    Copy All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestions.map(h => (
                    <HashtagCard
                      key={h.id}
                      hashtag={h}
                      selected={selectedHashtags.some(s => s.id === h.id)}
                      onSelect={handleSelect}
                      onCopy={handleCopy}
                      copied={copied}
                    />
                  ))}
                </div>
              </div>
            ) : !suggestLoading && suggestQuery && (
              <div className="text-center py-16 text-slate-500">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium">No suggestions found</p>
                <p className="text-sm mt-1">Try a different keyword</p>
              </div>
            )}

            {!suggestQuery && suggestions.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                <p className="text-lg font-medium text-slate-500">Get hashtag suggestions</p>
                <p className="text-sm mt-1">Enter a topic above and we'll find the best hashtags for your post</p>
              </div>
            )}
          </div>
        )}

        {/* Saved Sets Tab */}
        {activeTab === 'sets' && (
          <div>
            {sets.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Folder className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium">No saved sets yet</p>
                <p className="text-sm mt-1">
                  Browse hashtags, select the ones you like, and save them as a set
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Hash className="h-4 w-4" />
                  Browse Hashtags
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sets.map(set => (
                  <SetCard
                    key={set.id}
                    set={set}
                    onView={(s) => {
                      // Navigate to set detail — for now just fetch and show in a simple way
                      fetchSet(s.id).then(data => {
                        if (data.set?.hashtags) {
                          setSelectedHashtags(data.set.hashtags)
                          setActiveTab('browse')
                        }
                      })
                    }}
                    onDelete={handleDeleteSet}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Set Modal */}
        <SaveSetModal
          open={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveSet}
          selectedHashtags={selectedHashtags}
        />
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
