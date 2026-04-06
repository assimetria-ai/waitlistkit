// @custom — hook for the blog admin page
import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/@system/api'

export function useBlogAdmin() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/blog/admin')
      setPosts(res.posts ?? [])
    } catch {
      // keep empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const saveBlogPost = useCallback(async (postId, body) => {
    if (postId) {
      await api.patch(`/blog/${postId}`, body)
    } else {
      await api.post('/blog', body)
    }
  }, [])

  const togglePublish = useCallback(async (post) => {
    if (post.status === 'published') {
      await api.post(`/blog/${post.id}/unpublish`, {})
    } else {
      await api.post(`/blog/${post.id}/publish`, {})
    }
  }, [])

  const deleteBlogPost = useCallback(async (id) => {
    await api.delete(`/blog/${id}`)
  }, [])

  return { posts, loading, fetchPosts, saveBlogPost, togglePublish, deleteBlogPost }
}
