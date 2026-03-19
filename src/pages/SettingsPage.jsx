import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Save, LogOut, Loader2, CheckCircle2 } from 'lucide-react'

const FIELDS = [
  { key: 'cals', label: 'Daily Calories', unit: 'kcal', color: 'text-orange-400', min: 500,  max: 6000, step: 50  },
  { key: 'p',    label: 'Protein Goal',   unit: 'g',    color: 'text-blue-400',   min: 10,   max: 400,  step: 5   },
  { key: 'f',    label: 'Fat Goal',       unit: 'g',    color: 'text-yellow-400', min: 10,   max: 300,  step: 5   },
  { key: 'c',    label: 'Carbs Goal',     unit: 'g',    color: 'text-purple-400', min: 10,   max: 800,  step: 10  },
]

export default function SettingsPage({ onGoalsUpdate }) {
  const { user }          = useAuth()
  const [goals, setGoals] = useState({ cals: 2000, p: 150, f: 65, c: 250 })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().goals) {
        setGoals(snap.data().goals)
      }
    })
  }, [user])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await setDoc(doc(db, 'users', user.uid), { email: user.email, goals }, { merge: true })
    onGoalsUpdate?.(goals)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <h2 className="text-xl font-bold text-white mb-1">Settings</h2>
        <p className="text-xs text-gray-500 mb-6">Set your daily nutrition goals</p>

        <form onSubmit={handleSave} className="space-y-4">
          {FIELDS.map(f => (
            <div key={f.key} className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white">{f.label}</label>
                <span className={`text-lg font-bold ${f.color}`}>{goals[f.key]}<span className="text-xs text-gray-500 ml-1">{f.unit}</span></span>
              </div>
              <input
                type="range"
                min={f.min} max={f.max} step={f.step}
                value={goals[f.key]}
                onChange={e => setGoals(g => ({ ...g, [f.key]: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{f.min}{f.unit}</span><span>{f.max}{f.unit}</span>
              </div>
              {/* Also allow number input */}
              <input
                type="number"
                min={f.min} max={f.max} step={f.step}
                value={goals[f.key]}
                onChange={e => {
                  const v = Math.max(f.min, Math.min(f.max, Number(e.target.value)))
                  setGoals(g => ({ ...g, [f.key]: v }))
                }}
                className="mt-2 w-full bg-black border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Goals'}
          </button>
        </form>

        {/* Account */}
        <div className="mt-6 bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Signed in as</p>
          <p className="text-sm text-white mb-4 truncate">{user?.email}</p>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
