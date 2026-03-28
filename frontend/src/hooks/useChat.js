import { useState, useCallback, useRef } from 'react'
import { sendVoiceMessage, sendTextMessage, clearHistory } from '../services/api'

/**
 * Hook for managing chat state and communicating with the backend.
 */
export const useChat = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scenario, setScenario] = useState('free_talk')
  const conversationIdRef = useRef(null)
  const sessionStartRef = useRef(Date.now())

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), ...msg }])
  }, [])

  const sendVoice = useCallback(
    async (audioBlob) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await sendVoiceMessage(
          audioBlob,
          scenario,
          conversationIdRef.current
        )

        conversationIdRef.current = result.conversation_id

        // Add user bubble with transcription
        addMessage({
          role: 'user',
          content: result.transcription || '(no transcription)',
          transcription: result.transcription,
        })

        // Add assistant bubble
        addMessage({
          role: 'assistant',
          content: result.response,
          correction: result.correction,
          newExpression: result.new_expression,
          pronunciationTip: result.pronunciation_tip,
          audioUrl: result.audio_url,
        })

        return result
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Something went wrong'
        setError(msg)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [scenario, addMessage]
  )

  const sendText = useCallback(
    async (text) => {
      if (!text.trim()) return

      setIsLoading(true)
      setError(null)

      // Optimistic user message
      addMessage({ role: 'user', content: text })

      try {
        const result = await sendTextMessage(text, scenario, conversationIdRef.current)
        conversationIdRef.current = result.conversation_id

        addMessage({
          role: 'assistant',
          content: result.response,
          correction: result.correction,
          newExpression: result.new_expression,
          pronunciationTip: result.pronunciation_tip,
          audioUrl: result.audio_url,
        })

        return result
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Something went wrong'
        setError(msg)
        // Remove the optimistic user message on error
        setMessages((prev) => prev.slice(0, -1))
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [scenario, addMessage]
  )

  const clearConversation = useCallback(async () => {
    try {
      await clearHistory(conversationIdRef.current)
    } catch {
      // Ignore errors on clear
    }
    setMessages([])
    conversationIdRef.current = null
    sessionStartRef.current = Date.now()
    setError(null)
  }, [])

  const changeScenario = useCallback(
    async (newScenario) => {
      if (newScenario === scenario) return
      setScenario(newScenario)
      await clearConversation()
    },
    [scenario, clearConversation]
  )

  return {
    messages,
    isLoading,
    error,
    setError,
    scenario,
    conversationId: conversationIdRef.current,
    sendVoice,
    sendText,
    clearConversation,
    changeScenario,
  }
}
