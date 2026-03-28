import { useEffect, useRef } from 'react'

const MODES = {
  idle: 'idle',
  recording: 'recording',
  processing: 'processing',
}

/**
 * Large circular mic button with hold-to-record, wave animation, and haptic feedback.
 *
 * Props:
 *   isRecording: boolean
 *   isProcessing: boolean
 *   onStart: () => void
 *   onStop: () => void
 */
export default function VoiceButton({ isRecording, isProcessing, onStart, onStop }) {
  const mode = isProcessing
    ? MODES.processing
    : isRecording
    ? MODES.recording
    : MODES.idle

  const pressTimerRef = useRef(null)
  const isHoldingRef = useRef(false)

  // Prevent default to avoid text selection on long press
  const handlePointerDown = (e) => {
    e.preventDefault()
    if (isProcessing) return
    isHoldingRef.current = true
    pressTimerRef.current = setTimeout(() => {
      if (isHoldingRef.current && !isRecording) {
        onStart()
      }
    }, 100)
    if (!isRecording) onStart()
  }

  const handlePointerUp = (e) => {
    e.preventDefault()
    isHoldingRef.current = false
    clearTimeout(pressTimerRef.current)
    if (isRecording) onStop()
  }

  const handlePointerLeave = () => {
    isHoldingRef.current = false
    if (isRecording) onStop()
  }

  useEffect(() => {
    return () => clearTimeout(pressTimerRef.current)
  }, [])

  const buttonLabel = {
    idle: 'Hold to speak',
    recording: 'Release to send',
    processing: 'Processing...',
  }[mode]

  return (
    <div className="flex flex-col items-center gap-3 no-select">
      {/* Pulse ring behind button */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <span className="absolute w-[88px] h-[88px] rounded-full bg-red-500/20 animate-pulse-ring" />
            <span className="absolute w-[72px] h-[72px] rounded-full bg-red-500/10 animate-pulse-ring" style={{ animationDelay: '0.3s' }} />
          </>
        )}

        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => e.preventDefault()}
          disabled={isProcessing}
          aria-label={buttonLabel}
          className={`
            relative w-[60px] h-[60px] rounded-full flex items-center justify-center
            transition-all duration-150 select-none touch-none
            ${mode === 'idle' ? 'bg-accent-blue active:scale-95 active:bg-accent-blue-dim' : ''}
            ${mode === 'recording' ? 'bg-red-600 scale-110' : ''}
            ${mode === 'processing' ? 'bg-slate-600 cursor-not-allowed' : ''}
            shadow-lg
          `}
        >
          {mode === 'idle' && <MicIcon />}
          {mode === 'recording' && <WaveformIcon />}
          {mode === 'processing' && <SpinnerIcon />}
        </button>
      </div>

      <span className="text-xs text-text-secondary font-medium">{buttonLabel}</span>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function WaveformIcon() {
  return (
    <div className="flex items-center gap-[3px] h-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`wave-bar h-full text-white animate-wave-${i}`}
          style={{ backgroundColor: 'white' }}
        />
      ))}
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}
