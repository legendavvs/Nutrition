import { createContext, useContext, useState, useEffect } from 'react'

const en = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.history': 'History',
  'nav.settings': 'Settings',

  // Auth
  'auth.title': 'Calorie & Macro Tracker',
  'auth.signin': 'Sign In',
  'auth.signup': 'Sign Up',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.password_min': 'Password (min 6 chars)',
  'auth.create': 'Create Account',
  'auth.tagline': 'Track your nutrition, every day.',

  // Dashboard
  'dash.today': 'Today',
  'dash.cals': 'Calories',
  'dash.rem': 'kcal remaining',
  'dash.p': 'Protein',
  'dash.f': 'Fat',
  'dash.c': 'Carbs',
  'dash.eaten': 'Eaten today',
  'dash.empty.1': 'No food logged yet.',
  'dash.empty.2': 'Tap + to add your first entry.',

  // History
  'hist.title': 'History',
  'hist.today': 'Today',
  'hist.yesterday': 'Yesterday',
  'hist.empty': 'No entries for this day.',

  // Settings
  'set.title': 'Settings',
  'set.desc': 'Set your daily nutrition goals',
  'set.cals': 'Daily Calories',
  'set.p': 'Protein Goal',
  'set.f': 'Fat Goal',
  'set.c': 'Carbs Goal',
  'set.save': 'Save Goals',
  'set.saving': 'Saving…',
  'set.saved': 'Saved!',
  'set.acc': 'Signed in as',
  'set.logout': 'Sign out',

  // Add / Edit Modal
  'mod.add.title': 'Add Food',
  'mod.edit.title': 'Edit Logged Entry',
  'mod.scan': 'Scanner',
  'mod.scan.start': 'Tap to Scan Barcode',
  'mod.search': 'Search',
  'mod.search.ph': 'Search food database...',
  'mod.search.empty': 'No products found.',
  'mod.manual': 'Manual',
  'mod.look': 'Looking up product…',
  'mod.try': 'Try again',
  'mod.per100': 'per 100g',
  'mod.weight': 'Portion weight (grams)',
  'mod.addbtn': 'Add to Today',
  'mod.savebtn': 'Save Changes',
  'mod.name': 'Product name',
  'mod.name.ph': 'e.g. Chicken breast',
  'mod.t.kcal': 'Total Calories',
  'mod.t.weight': 'Portion Weight',
  'mod.t.p': 'Total Protein',
  'mod.t.f': 'Total Fat',
  'mod.t.c': 'Total Carbs',
  
  // Scanner
  'scan.err.cam': 'No camera found on this device.',
  'scan.err.fail': 'Failed to start camera. Please allow camera access.',
}

const uk = {
  // Navigation
  'nav.dashboard': 'Головна',
  'nav.history': 'Історія',
  'nav.settings': 'Налаштування',

  // Auth
  'auth.title': 'Трекер Калорій та БЖВ',
  'auth.signin': 'Увійти',
  'auth.signup': 'Реєстрація',
  'auth.email': 'Електронна пошта',
  'auth.password': 'Пароль',
  'auth.password_min': 'Пароль (від 6 симв.)',
  'auth.create': 'Створити акаунт',
  'auth.tagline': 'Контролюй своє харчування щодня.',

  // Dashboard
  'dash.today': 'Сьогодні',
  'dash.cals': 'Калорії',
  'dash.rem': 'ккал залишилось',
  'dash.p': 'Білки',
  'dash.f': 'Жири',
  'dash.c': 'Вугл.',
  'dash.eaten': 'З\'їдено сьогодні',
  'dash.empty.1': 'Ще нічого не додано.',
  'dash.empty.2': 'Натисни +, щоб додати їжу.',

  // History
  'hist.title': 'Історія',
  'hist.today': 'Сьогодні',
  'hist.yesterday': 'Вчора',
  'hist.empty': 'Немає записів за цей день.',

  // Settings
  'set.title': 'Налаштування',
  'set.desc': 'Встанови свої щоденні цілі',
  'set.cals': 'Денна норма калорій',
  'set.p': 'Норма білків',
  'set.f': 'Норма жирів',
  'set.c': 'Норма вуглеводів',
  'set.save': 'Зберегти цілі',
  'set.saving': 'Збереження…',
  'set.saved': 'Збережено!',
  'set.acc': 'Увійшли як',
  'set.logout': 'Вийти',

  // Add / Edit Modal
  'mod.add.title': 'Додати їжу',
  'mod.edit.title': 'Редагувати запис',
  'mod.scan': 'Сканер',
  'mod.scan.start': 'Відсканувати штрих-код',
  'mod.search': 'Знайти',
  'mod.search.ph': 'Пошук продуктів...',
  'mod.search.empty': 'Нічого не знайдено.',
  'mod.manual': 'Вручну',
  'mod.look': 'Пошук продукту…',
  'mod.try': 'Спробувати ще раз',
  'mod.per100': 'на 100г',
  'mod.weight': 'Вага порції (грами)',
  'mod.addbtn': 'Додати',
  'mod.savebtn': 'Зберегти зміни',
  'mod.name': 'Назва продукту',
  'mod.name.ph': 'напр. Куряче філе',
  'mod.t.kcal': 'Всього Калорій',
  'mod.t.weight': 'Вага Порції',
  'mod.t.p': 'Всього Білків',
  'mod.t.f': 'Всього Жирів',
  'mod.t.c': 'Всього Вуглеводів',

  // Scanner
  'scan.err.cam': 'Камеру не знайдено.',
  'scan.err.fail': 'Не вдалося запустити камеру. Надайте дозвіл.',
}

const dicts = { en, uk, uk_UA: uk, ru: uk }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    try {
      const userLang = navigator.language || navigator.userLanguage
      if (userLang.startsWith('uk') || userLang.startsWith('ru')) {
        setLang('uk')
      }
    } catch (e) {}
  }, [])

  function t(key) {
    return dicts[lang]?.[key] || dicts.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useTranslation = () => useContext(LanguageContext)
