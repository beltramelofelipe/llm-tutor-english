import { useState, useEffect } from 'react'
import { getVocabulary, getReviewVocabulary, markVocabReviewed, deleteVocab } from '../services/api'

export default function VocabularyPanel() {
  const [items, setItems] = useState([])
  const [reviewItems, setReviewItems] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async (q = '') => {
    setIsLoading(true)
    setError(null)
    try {
      const [vocabData, reviewData] = await Promise.all([
        getVocabulary(q),
        q ? Promise.resolve({ items: [] }) : getReviewVocabulary(),
      ])
      setItems(vocabData.items)
      setReviewItems(reviewData.items)
    } catch {
      setError('Failed to load vocabulary')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    fetchData(q)
  }

  const handleReviewed = async (id) => {
    await markVocabReviewed(id)
    fetchData(search)
  }

  const handleDelete = async (id) => {
    await deleteVocab(id)
    fetchData(search)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-bg-secondary border-b border-slate-800/50">
        <h1 className="text-base font-semibold text-text-primary mb-3">Vocabulary</h1>
        <input
          type="search"
          value={search}
          onChange={handleSearch}
          placeholder="Search words..."
          className="w-full bg-bg-card rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted border border-slate-700/50 outline-none focus:border-accent-blue/50 transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto chat-scroll">
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-700/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Review section */}
            {reviewItems.length > 0 && !search && (
              <div className="px-4 pt-4">
                <h2 className="text-xs font-semibold text-expression-yellow uppercase tracking-wider mb-2">
                  📚 Para Revisar ({reviewItems.length})
                </h2>
                <div className="space-y-2">
                  {reviewItems.map((item) => (
                    <VocabCard
                      key={item.id}
                      item={item}
                      highlight
                      onReviewed={handleReviewed}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All vocabulary */}
            <div className="px-4 pt-4 pb-4">
              {!search && (
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  All Words ({items.length})
                </h2>
              )}
              {items.length === 0 ? (
                <p className="text-center text-text-muted text-sm pt-8">
                  {search ? 'No results found' : 'Start a conversation to build your vocabulary!'}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <VocabCard
                      key={item.id}
                      item={item}
                      onReviewed={handleReviewed}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VocabCard({ item, highlight, onReviewed, onDelete }) {
  const date = new Date(item.date_added).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })

  return (
    <div
      className={`
        rounded-xl p-3.5 border
        ${highlight
          ? 'bg-expression-yellow-bg border-expression-yellow/20'
          : 'bg-bg-card border-slate-800/50'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-mono font-bold text-sm text-text-primary">{item.word}</div>
          <div className="text-xs text-text-secondary mt-0.5">{item.meaning_pt}</div>
          {item.example && (
            <div className="text-xs text-text-muted italic mt-1.5">&ldquo;{item.example}&rdquo;</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px] text-text-muted">{date}</span>
          {item.times_reviewed > 0 && (
            <span className="text-[10px] text-accent-blue">✓ {item.times_reviewed}×</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={() => onReviewed(item.id)}
          className="text-[11px] text-correction-green hover:text-green-400 transition-colors"
        >
          ✓ Reviewed
        </button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => onDelete(item.id)}
          className="text-[11px] text-text-muted hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
