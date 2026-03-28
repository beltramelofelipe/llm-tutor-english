/**
 * Bottom sheet modal for selecting the conversation mode.
 *
 * Props:
 *   current: string
 *   onSelect: (scenario: string) => void
 *   onClose: () => void
 */

const SCENARIOS = [
  {
    id: 'free_talk',
    icon: '💬',
    name: 'Free Talk',
    description: 'Conversa livre sobre qualquer assunto — descontraído e casual',
  },
  {
    id: 'interview',
    icon: '🎯',
    name: 'Interview',
    description: 'Simulação de entrevista técnica de AI Engineering',
  },
  {
    id: 'explain_project',
    icon: '🚀',
    name: 'Explain Project',
    description: 'Pratique explicar seus projetos técnicos em inglês',
  },
  {
    id: 'meeting',
    icon: '📋',
    name: 'Work Meeting',
    description: 'Simule uma reunião de trabalho em inglês',
  },
]

export default function ScenarioSelector({ current, onSelect, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary rounded-t-2xl shadow-xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        <div className="px-4 pb-2 pt-2">
          <h2 className="text-base font-semibold text-text-primary text-center mb-4">
            Choose Mode
          </h2>

          <div className="space-y-2 pb-safe-bottom">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelect(s.id)
                  onClose()
                }}
                className={`
                  w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-colors
                  ${current === s.id
                    ? 'bg-accent-blue/20 border border-accent-blue/40'
                    : 'bg-bg-card hover:bg-bg-hover border border-transparent'
                  }
                `}
              >
                <span className="text-2xl leading-none mt-0.5">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${current === s.id ? 'text-accent-blue' : 'text-text-primary'}`}>
                    {s.name}
                    {current === s.id && (
                      <span className="ml-2 text-xs font-normal opacity-70">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    {s.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="h-4" />
        </div>
      </div>
    </>
  )
}

export { SCENARIOS }
