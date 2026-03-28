import { useAudioPlayer } from '../hooks/useAudioPlayer'

/**
 * Chat message bubble supporting user and assistant roles.
 * Assistant bubbles include correction, expression, pronunciation tip, and audio play button.
 */
export default function MessageBubble({ message }) {
  const { isPlaying, currentUrl, toggle } = useAudioPlayer()
  const isUser = message.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1 max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      {/* Transcription label for user voice messages */}
      {isUser && message.transcription && (
        <span className="text-xs text-text-muted px-2">
          🎤 {message.transcription}
        </span>
      )}

      {/* Main bubble */}
      <div
        className={`
          rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-bg-card text-text-primary rounded-br-sm'
            : 'bg-bg-secondary text-text-primary rounded-bl-sm'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Audio play button for assistant */}
        {!isUser && message.audioUrl && (
          <button
            onClick={() => toggle(message.audioUrl)}
            className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent-blue transition-colors"
          >
            {isPlaying && currentUrl === message.audioUrl ? (
              <>
                <PauseIcon />
                <span>Stop</span>
              </>
            ) : (
              <>
                <PlayIcon />
                <span>Play</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Grammar correction card */}
      {!isUser && message.correction && (
        <div className="w-full rounded-xl bg-correction-green-bg border border-correction-green/30 px-4 py-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-correction-green font-semibold mb-1">
            <span>✏️</span>
            <span>Correction</span>
          </div>
          <div className="font-mono text-red-400 line-through">{message.correction.original}</div>
          <div className="font-mono text-correction-green">→ {message.correction.corrected}</div>
          {message.correction.explanation && (
            <p className="text-text-secondary mt-1 not-italic">{message.correction.explanation}</p>
          )}
        </div>
      )}

      {/* New expression card */}
      {!isUser && message.newExpression && (
        <div className="w-full rounded-xl bg-expression-yellow-bg border border-expression-yellow/30 px-4 py-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-expression-yellow font-semibold mb-1">
            <span>💡</span>
            <span>New Expression</span>
          </div>
          <div className="font-mono text-expression-yellow font-bold">{message.newExpression.expression}</div>
          <div className="text-text-secondary">{message.newExpression.meaning}</div>
          <div className="text-text-primary italic">&ldquo;{message.newExpression.example}&rdquo;</div>
        </div>
      )}

      {/* Pronunciation tip */}
      {!isUser && message.pronunciationTip && (
        <div className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 py-2.5 text-xs flex items-start gap-2">
          <span>🔊</span>
          <span className="text-text-secondary">{message.pronunciationTip}</span>
        </div>
      )}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}
