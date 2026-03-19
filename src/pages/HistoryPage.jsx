import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import EditEntryModal from '../components/EditEntryModal'

function dayStart(d) { const s = new Date(d); s.setHours(0,0,0,0); return s }
function dayEnd(d)   { const e = new Date(d); e.setHours(23,59,59,999); return e }
function fmtDate(d)  {
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
}

export default function HistoryPage() {
  const { user }          = useAuth()
  const [date, setDate]   = useState(new Date())
  const [entries, setEntries] = useState([])
  const [editEntry, setEditEntry] = useState(null)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'logs', user.uid, 'entries'),
      where('timestamp', '>=', dayStart(date)),
      where('timestamp', '<=', dayEnd(date)),
      orderBy('timestamp', 'desc')
    )
    return onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [user, date])

  function goBack()    { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d) }
  function goForward() {
    const d = new Date(date); d.setDate(d.getDate() + 1)
    if (d <= new Date()) setDate(d)
  }

  const totals = entries.reduce(
    (acc, e) => ({ cals: acc.cals + e.cals, p: acc.p + e.p, f: acc.f + e.f, c: acc.c + e.c }),
    { cals: 0, p: 0, f: 0, c: 0 }
  )

  async function removeEntry(id) {
    if (!user) return
    await deleteDoc(doc(db, 'logs', user.uid, 'entries', id))
  }

  const isToday = date.toDateString() === new Date().toDateString()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <h2 className="text-xl font-bold text-white mb-4">History</h2>

        {/* Date Nav */}
        <div className="flex items-center justify-between bg-[#121212] border border-[#2a2a2a] rounded-2xl p-3 mb-4">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#2a2a2a] transition-colors">
            <ChevronLeft size={18} className="text-gray-400" />
          </button>
          <span className="text-sm font-medium text-white">{fmtDate(date)}</span>
          <button
            onClick={goForward}
            disabled={isToday}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#2a2a2a] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Daily Totals */}
        {entries.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Kcal', val: Math.round(totals.cals),           color: 'text-orange-400' },
              { label: 'Protein', val: `${Math.round(totals.p)}g`,     color: 'text-blue-400' },
              { label: 'Fat',    val: `${Math.round(totals.f)}g`,       color: 'text-yellow-400' },
              { label: 'Carbs',  val: `${Math.round(totals.c)}g`,       color: 'text-purple-400' },
            ].map(item => (
              <div key={item.label} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-2.5 text-center">
                <p className={`text-base font-bold ${item.color}`}>{item.val}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-600 text-sm">
            <p className="text-3xl mb-2">📅</p>
            <p>No entries for this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <div key={e.id} onClick={() => setEditEntry(e)} className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:bg-[#1a1a1a] transition-colors animate-fade-in">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.name}</p>
                  <p className="text-xs text-gray-500">{e.weight}g · {new Date(e.timestamp?.toDate?.() || e.timestamp).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}</p>
                </div>
                <div className="flex gap-2.5 text-xs shrink-0 items-center">
                  <span className="text-orange-400 font-semibold">{Math.round(e.cals)}<span className="text-gray-600"> kcal</span></span>
                  <span className="text-blue-400">{Math.round(e.p * 10)/10}p</span>
                  <span className="text-yellow-400">{Math.round(e.f * 10)/10}f</span>
                  <span className="text-purple-400">{Math.round(e.c * 10)/10}c</span>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); removeEntry(e.id) }}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-1 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {editEntry && (
        <EditEntryModal
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onDelete={() => { removeEntry(editEntry.id); setEditEntry(null) }}
        />
      )}
    </div>
  )
}
