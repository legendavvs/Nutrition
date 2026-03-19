import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './contexts/AuthContext'
import AuthPage     from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage  from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import BottomNav    from './components/BottomNav'
import { Leaf, Loader2 } from 'lucide-react'

const DEFAULT_GOALS = { cals: 2000, p: 150, f: 65, c: 250 }

function Spinner() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
        <Leaf size={26} className="text-emerald-400" />
      </div>
      <Loader2 size={20} className="animate-spin text-emerald-500" />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [tab, setTab]     = useState('dashboard')
  const [goals, setGoals] = useState(DEFAULT_GOALS)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().goals) {
        setGoals(snap.data().goals)
      }
    })
  }, [user])

  if (loading) return <Spinner />
  if (!user)   return <AuthPage />

  const pages = {
    dashboard: <DashboardPage goals={goals} />,
    history:   <HistoryPage />,
    settings:  <SettingsPage onGoalsUpdate={setGoals} />,
  }

  return (
    <div className="flex flex-col h-dvh bg-black safe-top">
      {/* Top bar */}
      <header className="shrink-0 px-4 py-3 flex items-center gap-2.5 border-b border-[#1c1c1c]">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <Leaf size={14} className="text-emerald-400" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">NutriScan</span>
      </header>

      {/* Page content */}
      <main className="flex-1 min-h-0">
        {pages[tab]}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
