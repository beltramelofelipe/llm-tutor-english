import { useState, useRef, useCallback } from 'react'

/**
 * Hook for playing audio from a URL (TTS responses).
 *
 * Returns:
 *   isPlaying: boolean
 *   currentUrl: string | null
 *   play: (url: string) => void
 *   stop: () => void
 */
export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(null)
  const audioRef = useRef(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsPlaying(false)
    setCurrentUrl(null)
  }, [])

  const play = useCallback(
    (url) => {
      stop()

      const audio = new Audio(url)
      audioRef.current = audio
      setCurrentUrl(url)

      audio.onplay = () => setIsPlaying(true)
      audio.onended = () => {
        setIsPlaying(false)
        setCurrentUrl(null)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentUrl(null)
      }

      audio.play().catch(() => {
        setIsPlaying(false)
        setCurrentUrl(null)
      })
    },
    [stop]
  )

  const toggle = useCallback(
    (url) => {
      if (isPlaying && currentUrl === url) {
        stop()
      } else {
        play(url)
      }
    },
    [isPlaying, currentUrl, play, stop]
  )

  return { isPlaying, currentUrl, play, stop, toggle }
}
