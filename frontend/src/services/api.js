import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Chat endpoints
export const sendVoiceMessage = async (audioBlob, scenario, conversationId) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  formData.append('scenario', scenario)
  if (conversationId) formData.append('conversation_id', conversationId)

  const { data } = await api.post('/api/chat/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 45000, // longer timeout for voice processing
  })
  return data
}

export const sendTextMessage = async (message, scenario, conversationId) => {
  const { data } = await api.post('/api/chat/text', {
    message,
    scenario,
    conversation_id: conversationId || null,
  })
  return data
}

export const getHistory = async (conversationId) => {
  const params = conversationId ? { conversation_id: conversationId } : {}
  const { data } = await api.get('/api/chat/history', { params })
  return data
}

export const clearHistory = async (conversationId) => {
  const params = conversationId ? { conversation_id: conversationId } : {}
  const { data } = await api.delete('/api/chat/history', { params })
  return data
}

// Vocabulary endpoints
export const getVocabulary = async (search = '', limit = 100) => {
  const params = { limit }
  if (search) params.search = search
  const { data } = await api.get('/api/vocabulary', { params })
  return data
}

export const getReviewVocabulary = async () => {
  const { data } = await api.get('/api/vocabulary/review')
  return data
}

export const markVocabReviewed = async (vocabId) => {
  const { data } = await api.patch(`/api/vocabulary/${vocabId}/reviewed`)
  return data
}

export const deleteVocab = async (vocabId) => {
  const { data } = await api.delete(`/api/vocabulary/${vocabId}`)
  return data
}

// Progress endpoints
export const getProgressStats = async () => {
  const { data } = await api.get('/api/progress/stats')
  return data
}

export default api
