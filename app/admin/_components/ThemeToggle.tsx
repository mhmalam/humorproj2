'use client'

import { useEffect, useState } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme-preference'

function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return pref
}

export default function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = (pref: ThemePreference) => {
      const resolved = resolveTheme(pref)
      root.classList.remove('theme-light', 'theme-dark')
      root.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light')
      root.dataset.themePreference = pref
    }

    apply(preference)
    localStorage.setItem(STORAGE_KEY, preference)

    const onSystemChange = () => {
      if (preference === 'system') apply('system')
    }
    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [preference])

  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
        Theme
      </div>
      <div
        className="grid grid-cols-3 gap-1 p-1 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {([
          { id: 'light', label: 'Light' },
          { id: 'dark', label: 'Dark' },
          { id: 'system', label: 'System' },
        ] as const).map((opt) => {
          const active = preference === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreference(opt.id)}
              className={`px-2 py-1.5 text-[11px] rounded-md transition-colors ${
                active ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={active ? { background: 'rgba(139,92,246,0.18)' } : undefined}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
