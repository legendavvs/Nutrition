import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { Leaf, Mail, Lock, Loader2 } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

export default function AuthPage() {
  const { t } = useTranslation()
  const [mode, setMode]       = useState('login')  // 'login' | 'register'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', cred.user.uid), {
          email,
          goals: { cals: 2000, p: 150, f: 65, c: 250 },
        })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Email already registered.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address.',
      }
      setError(msgs[err.code] || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <Leaf className="text-emerald-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NutriScan</h1>
          <p className="text-xs text-gray-500">{t('auth.title')}</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#121212] border border-[#2a2a2a] rounded-2xl p-6">
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-[#2a2a2a] mb-6">
          {['login','register'].map(tab => (
            <button
              key={tab}
              onClick={() => { setMode(tab); setError('') }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === tab
                  ? 'bg-emerald-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'login' ? t('auth.signin') : t('auth.signup')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-black border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              placeholder={mode === 'register' ? t('auth.password_min') : t('auth.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-black border border-[#2a2a2a] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === 'login' ? t('auth.signin') : t('auth.create')}
          </button>
        </form>
      </div>

      <p className="text-gray-600 text-xs mt-6">{t('auth.tagline')}</p>
    </div>
  )
}
