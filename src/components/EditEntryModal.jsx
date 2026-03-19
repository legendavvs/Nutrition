import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { X, Loader2, Save, Trash2 } from 'lucide-react'

export default function EditEntryModal({ entry, onClose, onDelete }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  
  const [data, setData] = useState({
    name: entry.name || '',
    cals: entry.cals || 0,
    p: entry.p || 0,
    f: entry.f || 0,
    c: entry.c || 0,
    weight: entry.weight || 0
  })

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await updateDoc(doc(db, 'logs', user.uid, 'entries', entry.id), {
      name: data.name.trim(),
      cals: parseFloat(data.cals) || 0,
      p: parseFloat(data.p) || 0,
      f: parseFloat(data.f) || 0,
      c: parseFloat(data.c) || 0,
      weight: parseFloat(data.weight) || 0,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/70" onClick={onClose} />
      <div className="bg-[#121212] border-t border-[#2a2a2a] rounded-t-2xl w-full max-h-[90dvh] overflow-y-auto animate-fade-in">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#3a3a3a] rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-base font-semibold text-white">Edit Logged Entry</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a2a2a] transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="px-4 pb-8">
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Product name</label>
              <input
                required
                value={data.name}
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'cals', label: 'Total Calories', unit: 'kcal', color: 'text-orange-400' },
                { key: 'weight', label: 'Portion Weight',  unit: 'g',   color: 'text-gray-300' },
                { key: 'p',    label: 'Total Protein',   unit: 'g',   color: 'text-blue-400' },
                { key: 'f',    label: 'Total Fat',        unit: 'g',   color: 'text-yellow-400' },
                { key: 'c',    label: 'Total Carbs',      unit: 'g',   color: 'text-purple-400' },
              ].map(f => (
                <div key={f.key} className={f.key === 'cals' ? 'col-span-2' : ''}>
                  <label className={`text-xs mb-1 block ${f.color}`}>{f.label} <span className="text-gray-600">({f.unit})</span></label>
                  <input
                    type="number" min="0" step="any" required
                    value={data[f.key]}
                    onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))}
                    className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold rounded-xl px-4 py-3.5 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
