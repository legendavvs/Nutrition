import { useState, useCallback } from 'react'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { X, Loader2, ScanLine, PenLine, Search, AlertCircle } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'
import { useTranslation } from '../contexts/LanguageContext'

const EMPTY_MANUAL = { name: '', cals: '', p: '', f: '', c: '', weight: '100' }

function calcMacros(per100, weight) {
  const w = parseFloat(weight) || 0
  const ratio = w / 100
  return {
    cals: Math.round((parseFloat(per100.cals) || 0) * ratio),
    p:    Math.round((parseFloat(per100.p) || 0) * ratio * 10) / 10,
    f:    Math.round((parseFloat(per100.f) || 0) * ratio * 10) / 10,
    c:    Math.round((parseFloat(per100.c) || 0) * ratio * 10) / 10,
  }
}

export default function AddFoodModal({ onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tab, setTab]             = useState('scan')      // 'scan' | 'manual'
  const [scanned, setScanned]     = useState(null)        // product from API
  const [manual, setManual]       = useState(EMPTY_MANUAL)
  const [weight, setWeight]       = useState('100')       // for scanned product
  const [fetching, setFetching]   = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [saving, setSaving]       = useState(false)
  const [scanDone, setScanDone]   = useState(false)
  
  const [cameraActive, setCameraActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const handleBarcode = useCallback(async (barcode) => {
    if (fetching || scanned) return
    setScanDone(true)
    setFetching(true)
    setFetchError('')
    try {
      const r = await fetch(`/api/food/${barcode}`)
      if (!r.ok) throw new Error('Product not found in database')
      const data = await r.json()
      setScanned(data)
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setFetching(false)
    }
  }, [fetching, scanned])

  async function handleSearch(e) {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (!r.ok) throw new Error('Search failed')
      const data = await r.json()
      setSearchResults(data.products || [])
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearching(false)
    }
  }

  async function saveEntry(entryData) {
    setSaving(true)
    await addDoc(collection(db, 'logs', user.uid, 'entries'), {
      ...entryData,
      timestamp: Timestamp.now(),
    })
    setSaving(false)
    onClose()
  }

  async function handleSaveScanned() {
    if (!scanned) return
    const macros = calcMacros(scanned.per100g, weight)
    await saveEntry({ name: scanned.name, ...macros, weight: parseFloat(weight), barcode: scanned.barcode })
  }

  async function handleSaveManual(e) {
    e.preventDefault()
    const { name, cals, p, f, c, weight: w } = manual
    await saveEntry({
      name: name.trim(),
      cals: parseFloat(cals) || 0,
      p:    parseFloat(p)    || 0,
      f:    parseFloat(f)    || 0,
      c:    parseFloat(c)    || 0,
      weight: parseFloat(w)  || 0,
    })
  }

  const preview = scanned ? calcMacros(scanned.per100g, weight) : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="flex-1 bg-black/70" onClick={onClose} />

      {/* Sheet */}
      <div className="bg-[#121212] border-t border-[#2a2a2a] rounded-t-2xl w-full max-h-[90dvh] overflow-y-auto animate-fade-in">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#3a3a3a] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-base font-semibold text-white">{t('mod.add.title')}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a2a2a] transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-4">
          <div className="flex rounded-xl overflow-hidden border border-[#2a2a2a]">
            {[
              { key: 'scan',   icon: <ScanLine size={14}/>,  label: t('mod.scan') },
              { key: 'search', icon: <Search size={14}/>,    label: t('mod.search') },
              { key: 'manual', icon: <PenLine size={14}/>,   label: t('mod.manual')  },
            ].map(tabItem => (
              <button
                key={tabItem.key}
                onClick={() => { 
                  setTab(tabItem.key); 
                  setScanned(null); 
                  setScanDone(false); 
                  setCameraActive(false);
                  setFetchError('');
                  setSearchError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                  tab === tabItem.key ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tabItem.icon}{tabItem.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-8">
          {(scanned && !fetching) ? (
            <div className="animate-fade-in">
              {/* Product card (Editable) */}
              <div className="bg-black border border-[#2a2a2a] rounded-xl p-4 mb-4">
                <input
                  value={scanned.name}
                  onChange={e => setScanned(s => ({ ...s, name: e.target.value }))}
                  className="w-full bg-transparent text-base font-semibold text-white mb-0.5 border-b border-dashed border-[#2a2a2a] focus:border-emerald-500 focus:outline-none"
                />
                {scanned.brand && <p className="text-xs text-gray-500 mb-3">{scanned.brand}</p>}
                <div className="grid grid-cols-5 gap-1.5 text-xs text-center mt-3 items-end">
                  <div className="pb-1.5 text-left"><span className="text-gray-500">{t('mod.per100')}</span></div>
                  {[
                    { key: 'cals', l: 'Kcal', c: 'text-orange-400' },
                    { key: 'p', l: 'P(g)', c: 'text-blue-400' },
                    { key: 'f', l: 'F(g)', c: 'text-yellow-400' },
                    { key: 'c', l: 'C(g)', c: 'text-purple-400' },
                  ].map(x => (
                    <div key={x.key} className="flex flex-col items-center">
                      <input
                        type="number" min="0" step="any"
                        value={scanned.per100g[x.key]}
                        onChange={e => setScanned(s => ({
                          ...s, per100g: { ...s.per100g, [x.key]: e.target.value }
                        }))}
                        className={`w-full text-center bg-[#121212] border border-[#2a2a2a] rounded-md py-1.5 font-semibold ${x.c} focus:outline-none focus:border-emerald-500`}
                      />
                      <span className="text-gray-600 mt-1">{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight input */}
              <label className="text-xs text-gray-400 mb-1 block">{t('mod.weight')}</label>
              <input
                type="number" min="1" max="5000"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors mb-3"
              />

              {/* Preview recalculated macros */}
              {preview && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 flex justify-around text-center">
                  {[
                    { l: 'Kcal', v: preview.cals, c: 'text-orange-400' },
                    { l: 'P', v: `${preview.p}g`, c: 'text-blue-400' },
                    { l: 'F', v: `${preview.f}g`, c: 'text-yellow-400' },
                    { l: 'C', v: `${preview.c}g`, c: 'text-purple-400' },
                  ].map(x => (
                    <div key={x.l}>
                      <p className={`text-base font-bold ${x.c}`}>{x.v}</p>
                      <p className="text-xs text-gray-500">{x.l}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSaveScanned}
                disabled={saving}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {t('mod.addbtn')}
              </button>
            </div>
          ) : (
            <>
              {/* ── SCANNER TAB ── */}
              {tab === 'scan' && (
                <div>
                  {!scanDone && (
                    cameraActive ? (
                      <BarcodeScanner onDetected={handleBarcode} />
                    ) : (
                      <button
                        onClick={() => setCameraActive(true)}
                        className="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-[#121212] border border-[#2a2a2a] border-dashed rounded-xl text-gray-400 hover:text-white hover:border-emerald-500 transition-colors"
                      >
                        <ScanLine size={32} />
                        <span className="text-sm font-medium">{t('mod.scan.start')}</span>
                      </button>
                    )
                  )}

                  {fetching && (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Loader2 size={28} className="animate-spin text-emerald-400" />
                      <p className="text-sm text-gray-400">{t('mod.look')}</p>
                    </div>
                  )}

                  {fetchError && !fetching && (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <AlertCircle size={28} className="text-red-400" />
                      <p className="text-sm text-red-300">{fetchError}</p>
                      <button
                        onClick={() => { setScanDone(false); setFetchError(''); setCameraActive(true); }}
                        className="text-emerald-400 text-sm underline"
                      >
                        {t('mod.try')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── SEARCH TAB ── */}
              {tab === 'search' && (
                <div className="animate-fade-in">
                  <form onSubmit={handleSearch} className="relative mb-4">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder={t('mod.search.ph')}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-black border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                    <button type="submit" className="hidden" />
                  </form>

                  {searching && (
                    <div className="flex justify-center py-6">
                      <Loader2 size={24} className="animate-spin text-emerald-400" />
                    </div>
                  )}

                  {searchError && !searching && (
                    <p className="text-sm text-red-400 text-center py-4">{searchError}</p>
                  )}

                  {!searching && searchResults.length === 0 && searchQuery && !searchError && (
                    <p className="text-sm text-gray-500 text-center py-4">{t('mod.search.empty')}</p>
                  )}

                  {!searching && searchResults.length > 0 && (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                      {searchResults.map((p, i) => (
                        <div
                          key={i}
                          onClick={() => { setScanned(p); setWeight('100'); }}
                          className="bg-[#121212] border border-[#2a2a2a] rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                        >
                          {p.image ? (
                            <img src={p.image} alt="" className="w-12 h-12 object-cover bg-black rounded-lg" />
                          ) : (
                            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center border border-[#2a2a2a]">
                              <Search size={16} className="text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{p.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 truncate">{p.brand}</p>
                            <div className="flex gap-2 text-[10px] mt-1">
                              <span className="text-orange-400">{Math.round(p.per100g.cals)} kcal</span>
                              <span className="text-gray-600">·</span>
                              <span className="text-blue-400">{p.per100g.p}p</span>
                              <span className="text-gray-600">·</span>
                              <span className="text-yellow-400">{p.per100g.f}f</span>
                              <span className="text-gray-600">·</span>
                              <span className="text-purple-400">{p.per100g.c}c</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── MANUAL TAB ── */}
              {tab === 'manual' && (
                <form onSubmit={handleSaveManual} className="space-y-3 animate-fade-in">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t('mod.name')}</label>
                    <input
                      required placeholder={t('mod.name.ph')}
                      value={manual.name}
                      onChange={e => setManual(m => ({ ...m, name: e.target.value }))}
                      className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'cals', label: t('dash.cals'), unit: 'kcal', color: 'text-orange-400' },
                      { key: 'weight', label: t('mod.t.weight'),  unit: 'g',   color: 'text-gray-300' },
                      { key: 'p',    label: t('dash.p'),   unit: 'g',   color: 'text-blue-400' },
                      { key: 'f',    label: t('dash.f'),        unit: 'g',   color: 'text-yellow-400' },
                      { key: 'c',    label: t('dash.c'),      unit: 'g',   color: 'text-purple-400' },
                    ].map(f => (
                      <div key={f.key} className={f.key === 'cals' ? 'col-span-2' : ''}>
                        <label className={`text-xs mb-1 block ${f.color}`}>{f.label} <span className="text-gray-600">({f.unit})</span></label>
                        <input
                          type="number" min="0" step="any"
                          required
                          value={manual[f.key]}
                          onChange={e => setManual(m => ({ ...m, [f.key]: e.target.value }))}
                          className="w-full bg-black border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    {t('mod.addbtn')}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
