// @custom — hook for the Chatbase integration settings page
import { api } from '../../lib/@system/api'

export function useChatbaseSettings() {
  const fetchSettings = async () => {
    const { settings } = await api.get('/chatbase/settings')
    return settings ?? null
  }

  const saveSettings = async (body) => {
    const { settings } = await api.post('/chatbase/settings', body)
    return settings
  }

  const testConnection = async (chatbotId) => {
    return await api.post('/chatbase/test', { chatbot_id: chatbotId })
  }

  const removeSettings = async () => {
    await api.delete('/chatbase/settings')
  }

  return { fetchSettings, saveSettings, testConnection, removeSettings }
}
