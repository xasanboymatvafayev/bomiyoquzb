'use client'
import { useState, useEffect } from 'react'
import { createDeposit } from '@/lib/api'

interface Props { onClose: () => void; onSuccess: () => void }

const QUICK = [50000, 100000, 250000, 500000]
const CARD = "5614 6835 8227 9246"

export default function DepositModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'amount' | 'payment' | 'sent'>('amount')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const [copiedCard, setCopiedCard] = useState(false)

  async function handleDeposit() {
    const val = parseFloat(amount)
    if (!val || val < 10000) return setError('Minimal summa: 10 000 so\'m')
    setLoading(true); setError('')
    try {
      const data = await createDeposit(val)
      setOrderId(data.order_id)
      setStep('payment')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Xato yuz berdi')
    } finally { setLoading(false) }
  }

  function copyCard() {
    navigator.clipboard.writeText(CARD.replace(/\s/g, ''))
    setCopiedCard(true)
    setTimeout(() => setCopiedCard(false), 2000)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', borderRadius: '24px 24px 0 0',
        background: '#13131a', border: '1px solid rgba(255,60,172,0.15)',
        borderBottom: 'none', padding: '20px 20px 36px',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 20, fontWeight: 900 }}>
            {step === 'amount' ? '💳 Balansni to\'ldirish' : step === 'payment' ? '📤 To\'lov qilish' : '✅ Yuborildi'}
          </p>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: 10, width: 32, height: 32, color: '#6060a0', fontSize: 16, cursor: 'pointer',
          }}>✕</button>
        </div>

        {step === 'amount' && (
          <>
            <p className="label">Summa (min. 10 000 so'm)</p>
            <input
              type="number" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="input" min={10000}
              style={{ marginBottom: 12, fontSize: 20, fontWeight: 900 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
              {QUICK.map(v => (
                <button key={v} onClick={() => setAmount(String(v))} style={{
                  background: amount === String(v) ? 'rgba(255,60,172,0.15)' : 'var(--bg3)',
                  border: amount === String(v) ? '1.5px solid #ff3cac' : '1px solid var(--border)',
                  borderRadius: 12, padding: '10px 4px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 800,
                  color: amount === String(v) ? '#ff3cac' : '#c0c0e0',
                  transition: 'all 0.15s',
                }}>
                  {v >= 1000000 ? `${v/1000000}M` : `${v/1000}K`}
                </button>
              ))}
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{error}</p>}
            <button onClick={handleDeposit} disabled={loading} className="btn-primary">
              {loading ? '⏳ Yuklanmoqda...' : '➡️ Davom etish'}
            </button>
          </>
        )}

        {step === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Summa */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,60,172,0.1), rgba(168,85,247,0.08))',
              border: '1px solid rgba(255,60,172,0.2)',
              borderRadius: 16, padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: '#6060a0', fontWeight: 700 }}>To'lov summasi</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#ff3cac' }}>
                {Number(amount).toLocaleString()} so'm
              </span>
            </div>

            {/* Karta */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              border: '1px solid rgba(0,245,255,0.2)',
              borderRadius: 20, padding: 18,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#00f5ff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  💳 Uzcard
                </p>
                <span style={{ fontSize: 11, color: '#6060a0', fontWeight: 600 }}>Faqat shu kartaga</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.12em', color: '#fff', marginBottom: 12, fontFamily: 'monospace' }}>
                {CARD}
              </p>
              <button onClick={copyCard} style={{
                background: copiedCard ? 'rgba(0,255,135,0.15)' : 'rgba(0,245,255,0.1)',
                border: copiedCard ? '1px solid #00ff87' : '1px solid rgba(0,245,255,0.3)',
                borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                fontSize: 13, fontWeight: 800,
                color: copiedCard ? '#00ff87' : '#00f5ff',
                transition: 'all 0.2s',
              }}>
                {copiedCard ? '✅ Nusxalandi!' : '📋 Nusxalash'}
              </button>
            </div>

            {/* Izoh */}
            <div style={{
              background: 'rgba(255,230,0,0.06)',
              border: '1px solid rgba(255,230,0,0.15)',
              borderRadius: 14, padding: '12px 14px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#ffe600', marginBottom: 4 }}>⚠️ Muhim</p>
              <p style={{ fontSize: 12, color: '#c0c0a0', lineHeight: 1.6 }}>
                Kartaga aniq <b style={{ color: '#ffe600' }}>{Number(amount).toLocaleString()} so'm</b> o'tkazing.
                To'lovdan so'ng "To'lov qildim" tugmasini bosing.
                Admin 5-15 daqiqa ichida tasdiqlaydi.
              </p>
            </div>

            <p style={{ fontSize: 12, color: '#6060a0', textAlign: 'center' }}>
              Buyurtma raqami: <span style={{ color: '#a855f7', fontWeight: 800 }}>#{orderId}</span>
            </p>

            <button onClick={() => setStep('sent')} className="btn-primary">
              ✅ To'lov qildim
            </button>
          </div>
        )}

        {step === 'sent' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(0,255,135,0.2), rgba(0,245,255,0.15))',
              border: '2px solid rgba(0,255,135,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
            }}>✅</div>
            <p style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>So'rov yuborildi!</p>
            <p style={{ color: '#6060a0', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              Admin to'lovingizni tekshirib, 5-15 daqiqa ichida tasdiqlaydi.
            </p>
            <p style={{ color: '#a855f7', fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
              Buyurtma: #{orderId}
            </p>
            <button onClick={() => { onSuccess(); onClose() }} className="btn-primary" style={{
              background: 'linear-gradient(135deg, #00ff87, #00f5ff)', color: '#000',
            }}>
              🏠 Bosh sahifaga qaytish
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
