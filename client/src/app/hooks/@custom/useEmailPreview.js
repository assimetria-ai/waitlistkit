// @custom — hook for the email template preview page
import { useState, useEffect } from 'react'
import { api } from '../../lib/@system/api'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export function useEmailPreview() {
  const [templateNames, setTemplateNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchTemplateList() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/email-logs/preview')
      const names = data.templates ?? []
      setTemplateNames(names)
      return names
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplateList()
  }, [])

  function previewUrl(name) {
    return `${BASE_URL}/email-logs/preview/${name}`
  }

  return { templateNames, loading, error, fetchTemplateList, previewUrl }
}
