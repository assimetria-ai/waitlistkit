// @custom — hook for the PostScheduler create/edit component
import { api } from '../../lib/@system/api'

export function usePostScheduler() {
  const fetchPost = async (id) => {
    const data = await api.get(`/posts/${id}`)
    return data.post
  }

  const savePost = async (editId, body) => {
    if (editId) {
      await api.patch(`/posts/${editId}`, body)
    } else {
      await api.post('/posts', body)
    }
  }

  return { fetchPost, savePost }
}
