import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'
import VocabularyPanel from './components/VocabularyPanel'
import ProgressStats from './components/ProgressStats'

function BottomNav() {
  const location = useLocation()

  const tabs = [
    {
      to: '/',
      label: 'Chat',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: '/vocabulary',
      label: 'Vocab',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'none' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          {active && <line x1="9" y1="8" x2="15" y2="8" strokeWidth="2.5" />}
          {active && <line x1="9" y1="12" x2="13" y2="12" strokeWidth="2.5" />}
        </svg>
      ),
    },
    {
      to: '/progress',
      label: 'Progress',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="20" x2="18" y2="10" strokeWidth={active ? '2.5' : '2'} />
          <line x1="12" y1="20" x2="12" y2="4" strokeWidth={active ? '2.5' : '2'} />
          <line x1="6" y1="20" x2="6" y2="14" strokeWidth={active ? '2.5' : '2'} />
        </svg>
      ),
    },
  ]

  return (
    <nav className="flex bg-bg-secondary border-t border-slate-800/50 safe-bottom">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.to
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`
              flex-1 flex flex-col items-center justify-center py-2 gap-0.5
              transition-colors
              ${isActive ? 'text-accent-blue' : 'text-text-muted'}
            `}
          >
            {tab.icon(isActive)}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-full max-w-md mx-auto bg-bg-primary">
        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/vocabulary" element={<VocabularyPanel />} />
            <Route path="/progress" element={<ProgressStats />} />
          </Routes>
        </div>

        {/* Bottom navigation */}
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
