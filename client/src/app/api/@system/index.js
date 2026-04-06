// @system — core API calls (auth, user, subscriptions, sessions)
// Do not modify this file. Add product-specific calls in @custom/

import { apiRequest } from './utils.js'

// ─── Auth / User ────────────────────────────────────────────────────────────

export const register = (data) =>
  apiRequest.post('/users', data)

export const login = (data) =>
  apiRequest.post('/users/login', data)

export const auth = () =>
  apiRequest.post('/users/auth')

export const requestResetPassword = (data) =>
  apiRequest.post('/users/password/request', data)

export const resetPassword = (data) =>
  apiRequest.post('/users/password/reset', data)

export const editUser = (data) =>
  apiRequest.post('/users/edit', data)

// ─── Sessions ────────────────────────────────────────────────────────────────


export const getSessions = () =>
  apiRequest.get('/sessions')

export const revokeSession = (id) =>
  apiRequest.delete(`/sessions/${id}`)

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const getSubscriptions = () =>
  apiRequest.get('/subscriptions')

export const getAvailablePlans = (params) => {
  const qs = params?.showYearly ? '?showYearly=true' : ''
  return apiRequest.get(`/subscriptions/plans${qs}`)
}

export const handleSubscriptionCancellation = (data) => apiRequest.post('/subscriptions/cancellation-flow', data)

export const upgradeSubscription = (data) =>
  apiRequest.post('/subscriptions/upgrade', data)

export const uncancelSubscription = (data) =>
  apiRequest.post('/subscriptions/uncancel', data)
