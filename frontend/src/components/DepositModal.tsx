'use client'
import { useState, useEffect } from 'react'
import { createDeposit } from '@/lib/api'

interface Props { onClose: () => void; onSuccess: () => void }

const QUICK = [5000, 10000, 25000, 50000]

export default function DepositModal({ onClose, onSuccess }: Props) {
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

  const fmt = (s: number) =>
    `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  async function handleDeposit() {
    const val = parseFloat(amount)
    if (!val || val < 3000) return setError('Минимальная сумма: 3 000 ₽')
    setLoading(true); setError('')
    try {
      const data = await createDeposit(val)
      setPaymentUrl(data.payment_url)
      setCountdown(15 * 60)
      window.Telegram?.WebApp?.openLink(data.payment_url)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Ошибка при создании платежа')
    } finally { setLoading(false) }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', borderRadius: '24px 24px 0 0',
        background: '#13131a',
        border: '1px solid rgba(255,60,172,0.15)',
        borderBottom: 'none', padding: '20px 20px 32px',
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 20, fontWeight: 900 }}>💳 Пополнение</p>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: 10, width: 32, height: 32,
            color: '#6060a0', fontSize: 16, cursor: 'pointer',
          }}>✕</button>
        </div>

        {!paymentUrl ? (
          <>
            <p className="label">Сумма (мин. 3 000 ₽)</p>
            <input
              type="number" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0 ₽"
              className="input" min={3000}
              style={{ marginBottom: 12, fontSize: 20, fontWeight: 900 }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
              {QUICK.map(v => (
                <button key={v} onClick={() => setAmount(String(v))} style={{
                  background: amount === String(v) ? 'rgba(255,60,172,0.15)' : 'var(--bg3)',
                  border: amount === String(v) ? '1.5px solid #ff3cac' : '1px solid var(--border)',
                  borderRadius: 12, padding: '10px 4px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 800,
                  color: amount === String(v) ? '#ff3cac' : '#c0c0e0',
                  transition: 'all 0.15s',
                }}>
                  {(v/1000).toFixed(0)}k
                </button>
              ))}
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{error}</p>}

            <button onClick={handleDeposit} disabled={loading} className="btn-primary">
              {loading ? '⏳ Создание...' : '🚀 Перейти к оплате'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(255,60,172,0.2), rgba(168,85,247,0.2))',
              border: '2px solid rgba(255,60,172,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
            }}>⏱</div>
            <p style={{ fontSize: 40, fontWeight: 900, color: '#ff3cac', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {fmt(countdown)}
            </p>
            <p style={{ color: '#6060a0', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
              Платёжная страница открыта. После оплаты средства зачислятся автоматически.
            </p>
            <button onClick={() => window.Telegram?.WebApp?.openLink(paymentUrl)} className="btn-primary" style={{ marginBottom: 12 }}>
              🔗 Открыть страницу оплаты
            </button>
            <button onClick={() => { onSuccess(); onClose() }} style={{
              background: 'none', border: 'none', color: '#6060a0',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 8,
            }}>
              Я уже оплатил ✓
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
