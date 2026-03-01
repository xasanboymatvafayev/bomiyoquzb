'use client'
import { useState } from 'react'
import { orderPremium } from '@/lib/api'

const PLANS = [
  { period: '1_oy', label: '1 oy', price: 55000, color: '#00f5ff', per: 'Admin orqali (@Matvafaevv)' },
  { period: '3_oy', label: '3 oy', price: 200000, color: '#a855f7', badge: '🔥 Mashhur', per: '200 000 so\'m/oy' },
  { period: '6_oy', label: '6 oy', price: 370000, color: '#00ff87', badge: '💚 Foydali', per: '260 000 so\'m/oy' },
  { period: '12_oy', label: '12 oy', price: 680000, color: '#ffe600', badge: '⭐ Eng arzon', per: '430 000 so\'m/oy' },
]

interface Props { profile: any; onRefresh: () => void }

export default function Premium({ profile, onRefresh }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleBuy() {
    if (!selected) return setError('Reja tanlang')
    const username = profile?.username
    if (!username) return setError('Username topilmadi')
    setLoading(true); setError(''); setSuccess('')
    try {
      await orderPremium(selected, username)
      setSuccess('🎉 Premium avtomatik faollashadi!')
      onRefresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Xato yuz berdi')
    } finally { setLoading(false) }
  }

  const plan = PLANS.find(p => p.period === selected)

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="afu" style={{ paddingTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, fontSize: 24,
            background: 'linear-gradient(135deg, #a855f7, #00f5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
          }}>💎</div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 900 }}>Telegram Premium</p>
            <p style={{ fontSize: 12, color: '#6060a0', fontWeight: 600 }}>
              Balans: {profile ? `${Number(profile.balance).toLocaleString()} so'm` : '—'}
            </p>
          </div>
        </div>
      </div>

      <p className="label afu2">Reja tanlang</p>
      <div className="afu2" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {PLANS.map(p => {
          const active = selected === p.period
          return (
            <button key={p.period} onClick={() => setSelected(p.period)} style={{
              background: active ? `linear-gradient(135deg, ${p.color}18, ${p.color}08)` : 'var(--card)',
              border: active ? `1.5px solid ${p.color}` : '1px solid var(--border)',
              borderRadius: 18, padding: '14px 16px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.18s',
              boxShadow: active ? `0 4px 20px ${p.color}22` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${p.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>💎</div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: active ? p.color : '#f0f0f8' }}>{p.label}</p>
                  <p style={{ fontSize: 11, color: '#6060a0', fontWeight: 600 }}>{p.per}</p>
                  {p.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: p.color,
                      background: `${p.color}15`, padding: '2px 8px', borderRadius: 6,
                    }}>{p.badge}</span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 17, fontWeight: 900, color: active ? p.color : '#f0f0f8' }}>
                {p.price.toLocaleString()} so'm
              </p>
            </button>
          )
        })}
      </div>

      {plan && (
        <div className="afu" style={{
          background: `linear-gradient(135deg, ${plan.color}10, ${plan.color}05)`,
          border: `1px solid ${plan.color}30`,
          borderRadius: 16, padding: '12px 16px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#6060a0', fontWeight: 700 }}>To'lov summasi</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: plan.color }}>{plan.price.toLocaleString()} so'm</span>
        </div>
      )}

      {error && <p style={{ color: '#ff6b6b', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{error}</p>}
      {success && <p style={{ color: '#00ff87', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{success}</p>}

      <button onClick={handleBuy} disabled={loading || !selected} className="btn-primary" style={{
        background: 'linear-gradient(135deg, #a855f7, #00f5ff)',
        boxShadow: '0 4px 24px rgba(168,85,247,0.4)', color: '#fff',
      }}>
        {loading ? '⏳ Yuklanmoqda...' : '💎 Premium sotib olish'}
      </button>
    </div>
  )
}
