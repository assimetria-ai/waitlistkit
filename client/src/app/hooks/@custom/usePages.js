// @custom — Pages hook: usePage + savePage helper
// Pages call these hooks; hooks call api/@custom functions. Never use fetch() directly in pages.

import { useState, useEffect, useCallback } from 'react'
import { getPage, createPage, updatePage } from '../../api/@custom/index.js'

/**
 * Load a single CMS page by id (undefined for a new/unsaved page).
 * Returns { page, loading, error, savePage, saving }.
 *
 * savePage(payload, onSuccess) — creates or updates and calls onSuccess(saved).
 */
export function usePage(id) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const data = await getPage(id)
      const raw = data?.data ?? data
      setPage(raw ?? null)
    } catch (err) {
      setError(err?.message ?? 'Failed to load page')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const savePage = useCallback(async (payload, onSuccess) => {
    try {
      setSaving(true)
      setError(null)
      const data = id
        ? await updatePage(id, payload)
        : await createPage(payload)
      const raw = data?.data ?? data
      if (onSuccess) onSuccess(raw)
    } catch (err) {
      setError(err?.message ?? 'Failed to save page')
      throw err
    } finally {
      setSaving(false)
    }
  }, [id])

  return { page, setPage, loading, error, saving, savePage }
}
