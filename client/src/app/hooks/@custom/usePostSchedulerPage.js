// @custom — hook for the PostSchedulerPage (create/edit form)
import { api } from '../../lib/@system/api'

export function usePostSchedulerPage() {
  const fetchPost = async (id) => {
    const { post } = await api.get(`/posts/${id}`)
    return post
  }

  const savePost = async (id, body) => {
    if (id) {
      await api.patch(`/posts/${id}`, body)
    } else {
      await api.post('/posts', body)
    }
  }

  return { fetchPost, savePost }
}
