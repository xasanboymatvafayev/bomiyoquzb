'use client'
import { useState, useEffect } from 'react'
import { fetchHistory, fetchLeaderboard } from '@/lib/api'

interface ProfileProps {
  profile: any
}

const TYPE_LABELS: Record<string, string> = {
  deposit: '💳 Пополнение',
  stars: '⭐️ Stars',
  premium: '💎 Premium',
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'text-green-400',
  pending: 'text-yellow-400',
  failed: 'text-red-400',
  cancelled: 'text-gray-400',
}

export default function Profile({ profile }: ProfileProps) {
  const [tab, setTab] = useState<'history' | 'rating'>('history')
  const [history, setHistory] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tab === 'history') fetchHistory().then(setHistory).catch(console.error)
    if (tab === 'rating') fetchLeaderboard().then(setLeaderboard).catch(console.error)
  }, [tab])

  function copyReferral() {
    const link = `https://t.me/yourbot?start=${profile?.referral_code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4">
        <h2 className="text-2xl font-bold">👤 Профиль</h2>
      </div>

      {/* Profile card */}
      <div className="card space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--tg-theme-button-color)]/20 flex items-center justify-center text-2xl">
            {profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-lg">@{profile?.username || 'unknown'}</p>
            <p className="text-[var(--tg-theme-hint-color)] text-sm">
              Баланс: {profile ? `${Number(profile.balance).toLocaleString()} ₽` : '—'}
            </p>
          </div>
        </div>

        {/* Referral */}
        <div>
          <p className="text-xs text-[var(--tg-theme-hint-color)] mb-1">Реферальная ссылка</p>
          <button
            onClick={copyReferral}
            className="w-full text-left bg-black/20 rounded-lg px-3 py-2 text-sm text-[var(--tg-theme-link-color)] truncate"
          >
            {copied ? '✅ Скопировано!' : `t.me/yourbot?start=${profile?.referral_code || '...'}`}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-1">
        {(['history', 'rating'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t ? 'bg-[var(--tg-theme-button-color)] text-white' : 'text-[var(--tg-theme-hint-color)]'
            }`}
          >
            {t === 'history' ? '📋 История' : '🏆 Рейтинг'}
          </button>
        ))}
      </div>

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 && (
            <p className="text-center text-[var(--tg-theme-hint-color)] py-8">Нет транзакций</p>
          )}
          {history.map(tx => (
            <div key={tx.id} className="card flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{TYPE_LABELS[tx.type] || tx.type}</p>
                <p className="text-xs text-[var(--tg-theme-hint-color)]">
                  {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{Number(tx.amount).toLocaleString()} ₽</p>
                <p className={`text-xs ${STATUS_COLORS[tx.status]}`}>{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'rating' && (
        <div className="space-y-2">
          {leaderboard.map(row => (
            <div key={row.rank} className="card flex items-center gap-3">
              <span className={`text-lg font-bold w-8 text-center ${
                row.rank === 1 ? 'text-yellow-400' :
                row.rank === 2 ? 'text-gray-300' :
                row.rank === 3 ? 'text-amber-600' : 'text-[var(--tg-theme-hint-color)]'
              }`}>
                {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : `#${row.rank}`}
              </span>
              <p className="flex-1 font-medium">{row.username}</p>
              <p className="text-sm text-[var(--tg-theme-hint-color)]">{Number(row.total_spent).toLocaleString()} ₽</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
