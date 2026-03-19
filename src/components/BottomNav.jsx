import { LayoutDashboard, History, Settings } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

const TABS = [
  { key: 'dashboard', tKey: 'nav.dashboard', icon: LayoutDashboard },
  { key: 'history',   tKey: 'nav.history',   icon: History },
  { key: 'settings',  tKey: 'nav.settings',  icon: Settings },
]

export default function BottomNav({ active, onChange }) {
  const { t } = useTranslation()
  return (
    <nav className="bg-[#121212] border-t border-[#2a2a2a] safe-bottom shrink-0">
      <div className="flex">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{t(tKey)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
