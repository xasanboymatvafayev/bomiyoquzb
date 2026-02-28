'use client'
import { useState, useEffect } from 'react'
import Home from '@/components/Home'
import Stars from '@/components/Stars'
import Premium from '@/components/Premium'
import Profile from '@/components/Profile'
import DepositModal from '@/components/DepositModal'
import { fetchProfile } from '@/lib/api'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string
        initDataUnsafe: { user?: { id: number; username?: string; first_name?: string } }
        ready(): void
        expand(): void
        close(): void
        openLink(url: string): void
        setHeaderColor(color: string): void
        setBackgroundColor(color: string): void
        themeParams: Record<string, string>
        colorScheme: string
      }
    }
  }
}

export default function App() {
  const [tab, setTab] = useState<'home' | 'stars' | 'premium' | 'profile'>('home')
  const [profile, setProfile] = useState<any>(null)
  const [depositOpen, setDepositOpen] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#1c1c1e')
      tg.setBackgroundColor('#1c1c1e')
    }
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const data = await fetchProfile()
      setProfile(data)
    } catch (e) {
      console.error(e)
    }
  }

  const tabs = [
    { id: 'home', icon: '🏠', label: 'Главная' },
    { id: 'stars', icon: '⭐️', label: 'Stars' },
    { id: 'premium', icon: '💎', label: 'Premium' },
    { id: 'profile', icon: '👤', label: 'Профиль' },
  ] as const

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'home' && (
          <Home profile={profile} onDeposit={() => setDepositOpen(true)} onRefresh={loadProfile} />
        )}
        {tab === 'stars' && <Stars profile={profile} onRefresh={loadProfile} />}
        {tab === 'premium' && <Premium profile={profile} onRefresh={loadProfile} />}
        {tab === 'profile' && <Profile profile={profile} />}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-secondary-bg-color)] border-t border-white/10 flex items-center justify-around px-2 py-2 z-50">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              tab === t.id ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span className="text-2xl">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Deposit Modal */}
      {depositOpen && (
        <DepositModal onClose={() => setDepositOpen(false)} onSuccess={loadProfile} />
      )}
    </div>
  )
}
