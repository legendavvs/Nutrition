import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, Flame, Beef, Droplets, Wheat } from 'lucide-react'
import AddFoodModal from '../components/AddFoodModal'

function CircleProgress({ value, max, label, color, unit = '' }) {
  const pct    = Math.min(value / (max || 1), 1)
  const r      = 38
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1c1c1c" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
        <text x="48" y="44" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{value}</text>
        <text x="48" y="58" textAnchor="middle" fill="#6b7280" fontSize="9">{unit || 'g'}</text>
      </svg>
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs text-gray-600">{Math.round(pct * 100)}%</span>
    </div>
  )
}

function CalorieBar({ consumed, goal }) {
  const pct = Math.min(consumed / (goal || 1), 1)
  const over = consumed > goal

  return (
    <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-medium text-white">Calories</span>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${over ? 'text-red-400' : 'text-white'}`}>{consumed}</span>
          <span className="text-gray-500 text-sm"> / {goal} kcal</span>
        </div>
      </div>
      <div className="h-2.5 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${over ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1.5">{Math.max(0, goal - consumed)} kcal remaining</p>
    </div>
  )
}

function todayRange() {
  const start = new Date(); start.setHours(0,0,0,0)
  const end   = new Date(); end.setHours(23,59,59,999)
  return [start, end]
}

export default function DashboardPage({ goals }) {
  const { user }        = useAuth()
  const [entries, setEntries] = useState([])
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (!user) return
    const [start, end] = todayRange()
    const q = query(
      collection(db, 'logs', user.uid, 'entries'),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user])

  const totals = entries.reduce(
    (acc, e) => ({ cals: acc.cals + e.cals, p: acc.p + e.p, f: acc.f + e.f, c: acc.c + e.c }),
    { cals: 0, p: 0, f: 0, c: 0 }
  )

  async function removeEntry(id) {
    await deleteDoc(doc(db, 'logs', user.uid, 'entries', id))
  }

  const macros = [
    { key: 'p', label: 'Protein', color: '#3b82f6', icon: <Beef size={12}/> },
    { key: 'f', label: 'Fat',     color: '#f59e0b', icon: <Droplets size={12}/> },
    { key: 'c', label: 'Carbs',   color: '#a855f7', icon: <Wheat size={12}/> },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">Today</h2>
          <p className="text-xs text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
        </div>

        {/* Calorie Bar */}
        <CalorieBar consumed={Math.round(totals.cals)} goal={goals.cals} />

        {/* Macro Circles */}
        <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4 mb-4">
          <div className="flex justify-around">
            {macros.map(m => (
              <CircleProgress
                key={m.key}
                value={Math.round(totals[m.key] * 10) / 10}
                max={goals[m.key]}
                label={m.label}
                color={m.color}
              />
            ))}
          </div>
        </div>

        {/* Food List */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Eaten today</h3>
          {entries.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">
              <p className="text-3xl mb-2">🥗</p>
              <p>No food logged yet.</p>
              <p>Tap <strong>+</strong> to add your first entry.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(e => (
                <div key={e.id} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-3.5 flex items-center gap-3 animate-fade-in">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.weight}g</p>
                  </div>
                  <div className="flex gap-3 text-xs shrink-0">
                    <span className="text-orange-400 font-semibold">{Math.round(e.cals)}<span className="text-gray-600 font-normal"> kcal</span></span>
                    <span className="text-blue-400">{Math.round(e.p * 10)/10}<span className="text-gray-600">p</span></span>
                    <span className="text-yellow-400">{Math.round(e.f * 10)/10}<span className="text-gray-600">f</span></span>
                    <span className="text-purple-400">{Math.round(e.c * 10)/10}<span className="text-gray-600">c</span></span>
                  </div>
                  <button
                    onClick={() => removeEntry(e.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-1 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center pulse-accent transition-colors z-40"
      >
        <Plus size={26} className="text-black" />
      </button>

      {showAdd && <AddFoodModal goals={goals} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
