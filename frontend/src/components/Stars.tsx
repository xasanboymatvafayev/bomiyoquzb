'use client'
import { useState } from 'react'
import { orderStars } from '@/lib/api'

const PACKAGES = [
  { stars: 50, price: 5000 },
  { stars: 100, price: 9500 },
  { stars: 250, price: 22000 },
  { stars: 500, price: 43000 },
  { stars: 1000, price: 85000 },
]

interface StarsProps {
  profile: any
  onRefresh: () => void
}

export default function Stars({ profile, onRefresh }: StarsProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const username = profile?.username || window?.Telegram?.WebApp?.initDataUnsafe?.user?.username || ''

  async function handleBuy() {
    const stars = selected ?? (custom ? parseInt(custom) : 0)
    if (!stars || stars < 1) return setError('Выберите количество Stars')
    if (!username) return setError('Username не найден')
    setLoading(true)
    setError('')
    try {
      await orderStars(stars, username)
      setSuccess(`✅ Заказ на ${stars} Stars создан!`)
      onRefresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Ошибка при заказе')
    } finally {
      setLoading(false)
    }
  }

  const selectedStars = selected ?? (custom ? parseInt(custom) || 0 : 0)
  const price = PACKAGES.find(p => p.stars === selectedStars)?.price
    ?? (selectedStars > 0 ? Math.round(selectedStars * 85000 / 1000) : 0)

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h2 className="text-2xl font-bold">⭐️ Stars</h2>
        <p className="text-[var(--tg-theme-hint-color)] text-sm mt-1">
          Баланс: {profile ? `${Number(profile.balance).toLocaleString()} ₽` : '—'}
        </p>
      </div>

      <p className="section-title">Выберите пакет</p>
      <div className="grid grid-cols-3 gap-2">
        {PACKAGES.map(pkg => (
          <button
            key={pkg.stars}
            onClick={() => { setSelected(pkg.stars); setCustom('') }}
            className={`card text-center transition-all ${
              selected === pkg.stars
                ? 'ring-2 ring-[var(--tg-theme-button-color)]'
                : 'active:opacity-80'
            }`}
          >
            <p className="text-lg font-bold">{pkg.stars}</p>
            <p className="text-[10px] text-[var(--tg-theme-hint-color)]">⭐️</p>
            <p className="text-xs font-semibold mt-1 text-[var(--tg-theme-hint-color)]">
              {pkg.price.toLocaleString()} ₽
            </p>
          </button>
        ))}
      </div>

      <div>
        <p className="section-title">Своё количество</p>
        <input
          type="number"
          value={custom}
          onChange={e => { setCustom(e.target.value); setSelected(null) }}
          placeholder="Введите количество Stars"
          className="w-full bg-[var(--tg-theme-secondary-bg-color)] rounded-xl px-4 py-3 text-white placeholder-[var(--tg-theme-hint-color)] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)]"
          min={1}
        />
      </div>

      {selectedStars > 0 && (
        <div className="card flex justify-between items-center">
          <span className="text-[var(--tg-theme-hint-color)]">К оплате:</span>
          <span className="font-bold text-lg">{price.toLocaleString()} ₽</span>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      <button
        onClick={handleBuy}
        disabled={loading || selectedStars < 1}
        className="btn-primary"
      >
        {loading ? 'Обработка...' : `Купить ${selectedStars > 0 ? selectedStars + ' Stars' : ''}`}
      </button>
    </div>
  )
}
