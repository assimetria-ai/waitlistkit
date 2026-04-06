// @custom — hook for the no-code page editor
// Manages page load, block state, and save via the api module.
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/@system/api.js'

/**
 * Loads a page (when id is provided) and exposes savePage for create/update.
 * Returns { page, setPage, blocks, setBlocks, loading, saving, savePage }
 */
export function usePageEditor(id) {
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    api.get(`/pages/${id}`)
      .then((data) => {
        setPage(data)
        setBlocks(JSON.parse(data.content || '[]'))
      })
      .catch(() => {
        alert('Failed to load page')
      })
      .finally(() => setLoading(false))
  }, [id])

  const savePage = useCallback(async () => {
    try {
      setSaving(true)
      const payload = { ...page, content: JSON.stringify(blocks) }
      const saved = id
        ? await api.put(`/pages/${id}`, payload)
        : await api.post('/pages', payload)
      if (!id) navigate(`/pages/${saved.id}/edit`)
      alert('Page saved successfully!')
    } catch {
      alert('Failed to save page')
    } finally {
      setSaving(false)
    }
  }, [id, page, blocks, navigate])

  return { page, setPage, blocks, setBlocks, loading, saving, savePage }
}
