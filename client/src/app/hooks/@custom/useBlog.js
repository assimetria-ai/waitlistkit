// @custom — Blog hooks: useBlogPosts and useBlogPost
// Pages call these hooks; hooks call api/@custom functions. Never use fetch() directly in pages.

import { useState, useEffect, useCallback } from 'react'
import { getBlogPosts, getBlogPost } from '../../api/@custom/index.js'

/**
 * Fetch the full list of blog posts from the API.
 * Returns { posts, loading, error, refresh }.
 * On API failure `posts` is null so the caller can fall back to static data.
 */
export function useBlogPosts() {
  const [posts, setPosts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getBlogPosts()
      // api wrapper returns { data, status, message }
      const raw = data?.data ?? data
      if (raw?.posts && raw.posts.length > 0) {
        setPosts(raw.posts)
      } else {
        // API returned empty / no posts — stay null so static fallback kicks in
        setPosts(null)
      }
    } catch (err) {
      setError(err?.message ?? 'Failed to load posts')
      setPosts(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { posts, loading, error, refresh: load }
}

/**
 * Fetch a single blog post by slug.
 * Returns { post, notFound, loading, error }.
 * `post` is null when not found or on error (caller uses static fallback).
 * `notFound` is true only when the API returned a 404 for the slug.
 */
export function useBlogPost(slug) {
  const [post, setPost] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)
        const data = await getBlogPost(slug)
        if (cancelled) return
        // 404 comes back as { status: 404 } from the api wrapper (no throw)
        if (data?.status === 404) {
          setNotFound(true)
          setPost(null)
          return
        }
        const raw = data?.data ?? data
        const p = raw?.post ?? raw
        setPost(p ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load post')
          setPost(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  return { post, notFound, loading, error }
}
