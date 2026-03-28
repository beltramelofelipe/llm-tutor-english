import { useState, useRef, useCallback } from 'react'
import { getSupportedMimeType } from '../utils/audioUtils'

/**
 * Hook for recording audio via MediaRecorder API.
 *
 * Returns:
 *   isRecording: boolean
 *   isProcessing: boolean
 *   error: string | null
 *   startRecording: () => Promise<void>
 *   stopRecording: () => Promise<Blob | null>
 *   cancelRecording: () => void
 */
export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const mimeTypeRef = useRef('')

  const startRecording = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      mimeTypeRef.current = mimeType

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(100) // collect chunks every 100ms
      setIsRecording(true)

      // Haptic feedback on start
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow mic access and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.')
      } else {
        setError(`Recording error: ${err.message}`)
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current || 'audio/webm',
        })
        chunksRef.current = []

        // Stop all media tracks
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        setIsRecording(false)

        // Haptic feedback on stop
        if (navigator.vibrate) navigator.vibrate([30, 20, 30])

        resolve(blob)
      }

      recorder.stop()
    })
  }, [])

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    chunksRef.current = []
    setIsRecording(false)
    setIsProcessing(false)
  }, [])

  return {
    isRecording,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
