// @custom — hook for the posts list component
import { api } from '../../lib/@system/api'

export function usePostsList() {
  const fetchPosts = async (statusFilter) => {
    const params = new URLSearchParams()
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
    const data = await api.get(`/posts?${params}`)
    return data.posts || []
  }

  const duplicatePost = async (content) => {
    await api.post('/posts', { content, status: 'draft' })
  }

  const deletePost = async (id) => {
    await api.delete(`/posts/${id}`)
  }

  return { fetchPosts, duplicatePost, deletePost }
}
