'use client'
import { useState } from 'react'
import { orderStars } from '@/lib/api'

const PACKAGES = [
  { stars: 50, price: 13000, emoji: '✨' },
  { stars: 100, price: 24000, emoji: '⭐️' },
  { stars: 250, price: 58000, emoji: '🌟' },
  { stars: 500, price: 115000, emoji: '💫' },
  { stars: 1000, price: 227000, emoji: '🚀', hot: true },
]

interface Props { profile: any; onRefresh: () => void }

export default function Stars({ profile, onRefresh }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleBuy() {
    const stars = selected ?? (custom ? parseInt(custom) : 0)
    if (!stars || stars < 1) return setError('Stars miqdorini tanlang')
    const username = profile?.username
    if (!username) return setError('Username topilmadi')
    setLoading(true); setError(''); setSuccess('')
    try {
      await orderStars(stars, username)
      setSuccess(`🎉 ${stars} Stars buyurtmasi yaratildi!`)
      onRefresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Xato yuz berdi')
    } finally { setLoading(false) }
  }

  const selectedStars = selected ?? (custom ? parseInt(custom) || 0 : 0)
  const price = PACKAGES.find(p => p.stars === selectedStars)?.price
    ?? (selectedStars > 0 ? Math.round(selectedStars * 240000 / 1000) : 0)

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="afu" style={{ paddingTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, fontSize: 24,
            background: 'linear-gradient(135deg, #ffe600, #ff9500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255,230,0,0.35)',
          }}>⭐</div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 900 }}>Telegram Stars</p>
            <p style={{ fontSize: 12, color: '#6060a0', fontWeight: 600 }}>
              Balans: {profile ? `${Number(profile.balance).toLocaleString()} so'm` : '—'}
            </p>
          </div>
        </div>
      </div>

      <p className="label afu2">Paket tanlang</p>
      <div className="afu2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {PACKAGES.map(pkg => {
          const active = selected === pkg.stars
          return (
            <button key={pkg.stars} onClick={() => { setSelected(pkg.stars); setCustom('') }} style={{
              background: active ? 'linear-gradient(135deg, rgba(255,230,0,0.15), rgba(255,149,0,0.1))' : 'var(--card)',
              border: active ? '1.5px solid #ffe600' : '1px solid var(--border)',
              borderRadius: 16, padding: '12px 6px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.18s', position: 'relative',
              boxShadow: active ? '0 4px 16px rgba(255,230,0,0.2)' : 'none',
            }}>
              {pkg.hot && (
                <span style={{
                  position: 'absolute', top: -8, right: -6,
                  background: 'linear-gradient(135deg, #ff3cac, #a855f7)',
                  color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                }}>🔥HOT</span>
              )}
              <span style={{ fontSize: 20 }}>{pkg.emoji}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: active ? '#ffe600' : '#f0f0f8' }}>{pkg.stars}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6060a0' }}>
                {pkg.price >= 1000 ? `${(pkg.price/1000).toFixed(0)}K` : pkg.price} so'm
              </span>
            </button>
          )
        })}
      </div>

      <div className="afu3" style={{ marginBottom: 16 }}>
        <p className="label">O'z miqdoringiz</p>
        <input type="number" value={custom}
          onChange={e => { setCustom(e.target.value); setSelected(null) }}
          placeholder="Masalan: 750" className="input" min={1} />
      </div>

      {selectedStars > 0 && (
        <div className="afu" style={{
          background: 'linear-gradient(135deg, rgba(255,230,0,0.08), rgba(255,149,0,0.05))',
          border: '1px solid rgba(255,230,0,0.2)',
          borderRadius: 16, padding: '12px 16px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#6060a0', fontWeight: 700 }}>To'lov summasi</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#ffe600' }}>{price.toLocaleString()} so'm</span>
        </div>
      )}

      {error && <p style={{ color: '#ff6b6b', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{error}</p>}
      {success && <p style={{ color: '#00ff87', fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{success}</p>}

      <button onClick={handleBuy} disabled={loading || selectedStars < 1} className="btn-primary" style={{
        background: 'linear-gradient(135deg, #ffe600, #ff9500)',
        boxShadow: '0 4px 24px rgba(255,230,0,0.35)', color: '#000',
      }}>
        {loading ? '⏳ Yuklanmoqda...' : `⭐️ Sotib olish${selectedStars > 0 ? ` — ${selectedStars} Stars` : ''}`}
      </button>
    </div>
  )
}
