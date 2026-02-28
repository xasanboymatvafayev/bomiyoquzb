'use client'
import { useState } from 'react'
import { orderPremium } from '@/lib/api'

const PLANS = [
  { period: '1_oy', label: '1 месяц', price: 25000 },
  { period: '3_oy', label: '3 месяца', price: 65000, badge: 'Популярный' },
  { period: '6_oy', label: '6 месяцев', price: 120000, badge: 'Выгодно' },
  { period: '12_oy', label: '12 месяцев', price: 220000, badge: 'Лучшая цена' },
]

interface PremiumProps {
  profile: any
  onRefresh: () => void
}

export default function Premium({ profile, onRefresh }: PremiumProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const username = profile?.username || window?.Telegram?.WebApp?.initDataUnsafe?.user?.username || ''

  async function handleBuy() {
    if (!selected) return setError('Выберите план')
    if (!username) return setError('Username не найден')
    setLoading(true)
    setError('')
    try {
      await orderPremium(selected, username)
      setSuccess('✅ Premium активируется в ближайшее время!')
      onRefresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Ошибка при заказе')
    } finally {
      setLoading(false)
    }
  }

  const plan = PLANS.find(p => p.period === selected)

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h2 className="text-2xl font-bold">💎 Premium</h2>
        <p className="text-[var(--tg-theme-hint-color)] text-sm mt-1">
          Баланс: {profile ? `${Number(profile.balance).toLocaleString()} ₽` : '—'}
        </p>
      </div>

      <p className="section-title">Выберите план</p>
      <div className="space-y-2">
        {PLANS.map(p => (
          <button
            key={p.period}
            onClick={() => setSelected(p.period)}
            className={`card w-full flex justify-between items-center transition-all ${
              selected === p.period ? 'ring-2 ring-[var(--tg-theme-button-color)]' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div className="text-left">
                <p className="font-semibold">{p.label}</p>
                {p.badge && (
                  <span className="text-[10px] bg-[var(--tg-theme-button-color)]/20 text-[var(--tg-theme-button-color)] px-2 py-0.5 rounded-full">
                    {p.badge}
                  </span>
                )}
              </div>
            </div>
            <p className="font-bold">{p.price.toLocaleString()} ₽</p>
          </button>
        ))}
      </div>

      {plan && (
        <div className="card flex justify-between items-center">
          <span className="text-[var(--tg-theme-hint-color)]">К оплате:</span>
          <span className="font-bold text-lg">{plan.price.toLocaleString()} ₽</span>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      <button
        onClick={handleBuy}
        disabled={loading || !selected}
        className="btn-primary"
      >
        {loading ? 'Обработка...' : 'Купить Premium'}
      </button>
    </div>
  )
}
