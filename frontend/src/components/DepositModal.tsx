'use client'
import { useState, useEffect } from 'react'
import { createDeposit } from '@/lib/api'

interface DepositModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function DepositModal({ onClose, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [paymentUrl, setPaymentUrl] = useState('')

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  async function handleDeposit() {
    const val = parseFloat(amount)
    if (!val || val < 3000) return setError('Минимальная сумма: 3 000 ₽')
    setLoading(true)
    setError('')
    try {
      const data = await createDeposit(val)
      setPaymentUrl(data.payment_url)
      setCountdown(15 * 60)
      window.Telegram?.WebApp?.openLink(data.payment_url)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Ошибка при создании платежа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-[var(--tg-theme-bg-color)] rounded-t-2xl p-6 pb-10 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">💳 Пополнение</h3>
          <button onClick={onClose} className="text-[var(--tg-theme-hint-color)] text-xl">✕</button>
        </div>

        {!paymentUrl ? (
          <>
            <div>
              <p className="section-title">Сумма (минимум 3 000 ₽)</p>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Введите сумму"
                className="w-full bg-[var(--tg-theme-secondary-bg-color)] rounded-xl px-4 py-3 text-white placeholder-[var(--tg-theme-hint-color)] outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)] text-lg"
                min={3000}
              />
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 25000, 50000].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="card text-center text-sm font-medium py-2 active:opacity-70"
                >
                  {v.toLocaleString()}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button onClick={handleDeposit} disabled={loading} className="btn-primary">
              {loading ? 'Создание платежа...' : 'Перейти к оплате'}
            </button>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-5xl">⏱</div>
            <p className="text-2xl font-bold text-[var(--tg-theme-button-color)]">
              {formatCountdown(countdown)}
            </p>
            <p className="text-[var(--tg-theme-hint-color)] text-sm">
              Платёжная страница открыта. После оплаты средства зачислятся автоматически.
            </p>
            <button
              onClick={() => window.Telegram?.WebApp?.openLink(paymentUrl)}
              className="btn-primary"
            >
              Открыть страницу оплаты
            </button>
            <button
              onClick={() => { onSuccess(); onClose() }}
              className="w-full text-[var(--tg-theme-hint-color)] text-sm py-2"
            >
              Я уже оплатил
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
