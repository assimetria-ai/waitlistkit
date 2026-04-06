// @custom — hook for the PageEditorPage (block-based no-code editor)
import { api } from '../../lib/@system/api'

export function usePageEditorPage() {
  const fetchPage = async (id) => {
    return await api.get(`/pages/${id}`)
  }

  const saveBlocks = async (id, blocks) => {
    await api.patch(`/pages/${id}`, { blocks })
  }

  const publishPage = async (id) => {
    await api.post(`/pages/${id}/publish`, {})
  }

  return { fetchPage, saveBlocks, publishPage }
}
