'use client'
import { useState, useEffect } from 'react'
import { fetchHistory, fetchLeaderboard } from '@/lib/api'

const TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  deposit: { label: 'Balans to\'ldirish', color: '#00f5ff', icon: '💳' },
  stars: { label: 'Stars', color: '#ffe600', icon: '⭐️' },
  premium: { label: 'Premium', color: '#a855f7', icon: '💎' },
}
const STATUS_LABELS: Record<string, string> = {
  paid: 'Tasdiqlandi', pending: 'Kutilmoqda', failed: 'Xato', cancelled: 'Bekor'
}
const STATUS_COLORS: Record<string, string> = {
  paid: '#00ff87', pending: '#ffe600', failed: '#ff6b6b', cancelled: '#6060a0'
}

interface Props { profile: any }

export default function Profile({ profile }: Props) {
  const [tab, setTab] = useState<'history'|'rating'>('history')
  const [history, setHistory] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tab === 'history') fetchHistory().then(setHistory).catch(() => {})
    if (tab === 'rating') fetchLeaderboard().then(setLeaderboard).catch(() => {})
  }, [tab])

  function copyReferral() {
    navigator.clipboard.writeText(`https://t.me/yourbot?start=${profile?.referral_code}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="afu" style={{ paddingTop: 16, marginBottom: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a0a1e, #0a0a1a)',
          border: '1px solid rgba(255,60,172,0.15)',
          borderRadius: 24, padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, #ff3cac, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: '#fff',
              boxShadow: '0 4px 16px rgba(255,60,172,0.4)',
            }}>
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 900 }}>@{profile?.username || 'unknown'}</p>
              <p style={{ fontSize: 13, color: '#00ff87', fontWeight: 700 }}>
                {profile ? `${Number(profile.balance).toLocaleString()} so'm` : '—'}
              </p>
            </div>
          </div>
          <p className="label" style={{ marginBottom: 6 }}>Referal havola</p>
          <button onClick={copyReferral} style={{
            width: '100%', background: 'rgba(0,245,255,0.06)',
            border: '1px solid rgba(0,245,255,0.15)', borderRadius: 12,
            padding: '10px 14px', color: copied ? '#00ff87' : '#00f5ff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.2s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {copied ? '✅ Nusxalandi!' : `t.me/yourbot?start=${profile?.referral_code || '...'}`}
          </button>
        </div>

        <div style={{
          display: 'flex', background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 16, padding: 4, marginBottom: 14, gap: 4,
        }}>
          {(['history','rating'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0',
              background: tab === t ? 'linear-gradient(135deg, #ff3cac, #a855f7)' : 'transparent',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              fontSize: 13, fontWeight: 800,
              color: tab === t ? '#fff' : '#6060a0', transition: 'all 0.2s',
            }}>
              {t === 'history' ? '📋 Tarix' : '🏆 Reyting'}
            </button>
          ))}
        </div>

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6060a0' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
                <p style={{ fontWeight: 700 }}>Tranzaksiyalar yo'q</p>
              </div>
            )}
            {history.map(tx => {
              const meta = TYPE_LABELS[tx.type] || { label: tx.type, color: '#6060a0', icon: '📄' }
              return (
                <div key={tx.id} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${meta.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>{meta.icon}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>{meta.label}</p>
                      <p style={{ fontSize: 11, color: '#6060a0', fontWeight: 600 }}>
                        {new Date(tx.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 15, fontWeight: 900 }}>{Number(tx.amount).toLocaleString()} so'm</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[tx.status] || '#6060a0' }}>
                      {STATUS_LABELS[tx.status] || tx.status}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'rating' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaderboard.map((row, i) => {
              const medals = ['🥇','🥈','🥉']
              const colors = ['#ffe600','#c0c0d0','#cd7f32']
              return (
                <div key={row.rank} style={{
                  background: i < 3 ? `linear-gradient(135deg, ${colors[i]}10, ${colors[i]}05)` : 'var(--card)',
                  border: i < 3 ? `1px solid ${colors[i]}30` : '1px solid var(--border)',
                  borderRadius: 16, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: i < 3 ? 22 : 14, fontWeight: 900, width: 28, textAlign: 'center', color: colors[i] || '#6060a0' }}>
                    {i < 3 ? medals[i] : `#${row.rank}`}
                  </span>
                  <p style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{row.username}</p>
                  <p style={{ fontSize: 13, fontWeight: 900, color: i < 3 ? colors[i] : '#6060a0' }}>
                    {Number(row.total_spent).toLocaleString()} so'm
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
