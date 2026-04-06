// @custom — hook for the posts list page (paginated)
import { api } from '../../lib/@system/api'

export function usePostsPage() {
  const fetchPosts = async (statusFilter, limit, offset) => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (limit != null) params.set('limit', String(limit))
    if (offset != null) params.set('offset', String(offset))
    const data = await api.get(`/posts?${params}`)
    return { posts: data.posts || [], total: data.total ?? 0 }
  }

  const deletePost = async (id) => {
    await api.delete(`/posts/${id}`)
  }

  return { fetchPosts, deletePost }
}
