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
        colorScheme: string
      }
    }
  }
}

const TABS = [
  { id: 'home', icon: '🏠', label: 'Главная' },
  { id: 'stars', icon: '⭐️', label: 'Stars' },
  { id: 'premium', icon: '💎', label: 'Premium' },
  { id: 'profile', icon: '👤', label: 'Профиль' },
] as const

export default function App() {
  const [tab, setTab] = useState<'home'|'stars'|'premium'|'profile'>('home')
  const [profile, setProfile] = useState<any>(null)
  const [depositOpen, setDepositOpen] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#0d0d0f'); tg.setBackgroundColor('#0d0d0f') }
    loadProfile()
  }, [])

  async function loadProfile() {
    try { setProfile(await fetchProfile()) } catch {}
  }

  return (
    <div style={{ paddingBottom: 72, minHeight: '100vh' }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {tab === 'home' && <Home profile={profile} onDeposit={() => setDepositOpen(true)} onRefresh={loadProfile} />}
        {tab === 'stars' && <Stars profile={profile} onRefresh={loadProfile} />}
        {tab === 'premium' && <Premium profile={profile} onRefresh={loadProfile} />}
        {tab === 'profile' && <Profile profile={profile} />}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 4px 12px',
      }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: active ? 'rgba(255,60,172,0.12)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: 22, opacity: active ? 1 : 0.4, transition: 'opacity 0.2s' }}>{t.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
                color: active ? '#ff3cac' : '#6060a0',
                transition: 'color 0.2s', textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>{t.label}</span>
            </button>
          )
        })}
      </nav>

      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} onSuccess={loadProfile} />}
    </div>
  )
}
