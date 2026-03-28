import { useState, useEffect } from 'react'
import { getProgressStats } from '../services/api'

export default function ProgressStats() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getProgressStats()
        setStats(data)
      } catch {
        setError('Failed to load stats')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-text-muted text-sm">{error}</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Sessions', value: stats.total_sessions, icon: '📅' },
    { label: 'Messages', value: stats.total_messages, icon: '💬' },
    { label: 'Words Learned', value: stats.vocabulary_count, icon: '📚' },
    { label: 'Day Streak', value: `${stats.streak_days}🔥`, icon: '⚡' },
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto chat-scroll">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-bg-secondary border-b border-slate-800/50">
        <h1 className="text-base font-semibold text-text-primary">Progress</h1>
        <p className="text-xs text-text-muted mt-0.5">Keep it up, Felipe! 💪</p>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-5">
        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-bg-card rounded-2xl p-4 border border-slate-800/50"
            >
              <div className="text-xl mb-1">{card.icon}</div>
              <div className="text-2xl font-bold text-text-primary">{card.value}</div>
              <div className="text-xs text-text-muted mt-0.5">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Today / This week */}
        <div className="bg-bg-card rounded-2xl p-4 border border-slate-800/50">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Activity
          </h2>
          <div className="flex gap-6">
            <div>
              <div className="text-xl font-bold text-text-primary">{stats.messages_today}</div>
              <div className="text-xs text-text-muted">msgs today</div>
            </div>
            <div>
              <div className="text-xl font-bold text-text-primary">{stats.sessions_this_week}</div>
              <div className="text-xs text-text-muted">sessions / week</div>
            </div>
          </div>
        </div>

        {/* Top errors */}
        {stats.top_errors.length > 0 && (
          <div className="bg-bg-card rounded-2xl p-4 border border-slate-800/50">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              🔁 Recurring Mistakes
            </h2>
            <div className="space-y-3">
              {stats.top_errors.map((err) => (
                <div key={err.id} className="text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-[10px] font-medium">
                      {err.error_type}
                    </span>
                    <span className="text-text-muted">×{err.count}</span>
                  </div>
                  <div className="font-mono text-red-400 line-through text-[11px]">
                    {err.original}
                  </div>
                  <div className="font-mono text-correction-green text-[11px]">
                    → {err.corrected}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.top_errors.length === 0 && stats.total_messages === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🌟</div>
            <p className="text-text-secondary text-sm font-medium">No stats yet</p>
            <p className="text-text-muted text-xs mt-1">
              Start a conversation to track your progress!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
