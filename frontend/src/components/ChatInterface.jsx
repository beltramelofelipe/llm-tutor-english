import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import MessageBubble from './MessageBubble'
import VoiceButton from './VoiceButton'
import ScenarioSelector from './ScenarioSelector'
import { SCENARIOS } from './ScenarioSelector'

export default function ChatInterface() {
  const [showScenario, setShowScenario] = useState(false)
  const [textMode, setTextMode] = useState(false)
  const [textInput, setTextInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const {
    messages,
    isLoading,
    error,
    setError,
    scenario,
    sendVoice,
    sendText,
    clearConversation,
    changeScenario,
  } = useChat()

  const {
    isRecording,
    isProcessing,
    setIsProcessing,
    error: recorderError,
    setError: setRecorderError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleStartRecording = async () => {
    setError(null)
    setRecorderError(null)
    await startRecording()
  }

  const handleStopRecording = async () => {
    setIsProcessing(true)
    const blob = await stopRecording()
    if (blob && blob.size > 100) {
      await sendVoice(blob)
    }
    setIsProcessing(false)
  }

  const handleSendText = async (e) => {
    e.preventDefault()
    const text = textInput.trim()
    if (!text || isLoading) return
    setTextInput('')
    await sendText(text)
  }

  const currentScenario = SCENARIOS.find((s) => s.id === scenario)
  const displayError = error || recorderError

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-slate-800/50">
        <div>
          <h1 className="text-sm font-semibold text-text-primary">
            Alex — English Tutor
          </h1>
          <button
            onClick={() => setShowScenario(true)}
            className="flex items-center gap-1.5 text-xs text-accent-blue hover:text-blue-400 transition-colors mt-0.5"
          >
            <span>{currentScenario?.icon}</span>
            <span>{currentScenario?.name}</span>
            <ChevronIcon />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-2 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
              title="New conversation"
            >
              <RefreshIcon />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-4xl">👋</div>
            <div>
              <p className="text-text-primary font-medium text-sm">
                Hi Felipe! I&apos;m Alex, your English tutor.
              </p>
              <p className="text-text-secondary text-xs mt-1 max-w-[240px]">
                Hold the mic button to speak, or tap the keyboard icon to type.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="self-start flex items-center gap-2 px-4 py-3 bg-bg-secondary rounded-2xl rounded-bl-sm text-sm text-text-secondary max-w-[120px]">
            <ThinkingDots />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {displayError && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-xl text-xs text-red-300 flex items-center justify-between gap-2">
          <span>{displayError}</span>
          <button
            onClick={() => { setError(null); setRecorderError(null) }}
            className="text-red-400 hover:text-red-200 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 pb-2 bg-bg-secondary border-t border-slate-800/50 safe-bottom">
        {textMode ? (
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTextMode(false)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <MicIcon />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type in English..."
              autoFocus
              className="flex-1 bg-bg-card rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted border border-slate-700/50 outline-none focus:border-accent-blue/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-accent-blue disabled:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <SendIcon />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setTextMode(true)}
              className="p-2 text-text-muted hover:text-text-secondary transition-colors"
              title="Switch to text mode"
            >
              <KeyboardIcon />
            </button>

            <VoiceButton
              isRecording={isRecording}
              isProcessing={isProcessing || isLoading}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
            />

            <div className="w-10" /> {/* Spacer for symmetry */}
          </div>
        )}
      </div>

      {/* Scenario selector modal */}
      {showScenario && (
        <ScenarioSelector
          current={scenario}
          onSelect={changeScenario}
          onClose={() => setShowScenario(false)}
        />
      )}
    </div>
  )
}

// Inline small icons to avoid extra deps
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="1,4 1,10 7,10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="10" strokeWidth="2.5" />
      <line x1="10" y1="10" x2="10" y2="10" strokeWidth="2.5" />
      <line x1="14" y1="10" x2="14" y2="10" strokeWidth="2.5" />
      <line x1="18" y1="10" x2="18" y2="10" strokeWidth="2.5" />
      <line x1="8" y1="14" x2="16" y2="14" strokeWidth="2.5" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22,2 15,22 11,13 2,9" />
    </svg>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
