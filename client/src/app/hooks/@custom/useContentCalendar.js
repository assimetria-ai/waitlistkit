// @custom — hook for the content calendar page
import { api } from '../../lib/@system/api'

export function useContentCalendar() {
  const fetchPosts = async (params) => {
    const data = await api.get(`/posts?${params}`)
    return data.posts || []
  }

  const savePost = async (data) => {
    if (data.id) {
      await api.patch(`/posts/${data.id}`, data)
    } else {
      await api.post('/posts', data)
    }
  }

  const deletePost = async (id) => {
    await api.delete(`/posts/${id}`)
  }

  const reschedulePost = async (postId, scheduledFor) => {
    await api.patch(`/posts/${postId}/reschedule`, { scheduled_for: scheduledFor })
  }

  return { fetchPosts, savePost, deletePost, reschedulePost }
}
