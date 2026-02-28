'use client'

interface HomeProps {
  profile: any
  onDeposit: () => void
  onRefresh: () => void
}

export default function Home({ profile, onDeposit, onRefresh }: HomeProps) {
  const premiumDate = profile?.premium_expire
    ? new Date(profile.premium_expire).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-4 pb-2">
        <h1 className="text-2xl font-bold">
          Привет, {profile?.username || 'пользователь'} 👋
        </h1>
        <p className="text-[var(--tg-theme-hint-color)] text-sm mt-1">Ваш кошелёк</p>
      </div>

      {/* Balance Card */}
      <div className="card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
        <div className="relative">
          <p className="text-[var(--tg-theme-hint-color)] text-sm">Баланс</p>
          <p className="text-4xl font-bold mt-1">
            {profile ? `${Number(profile.balance).toLocaleString('ru-RU')} ₽` : '—'}
          </p>
          <button
            onClick={onDeposit}
            className="mt-4 flex items-center gap-2 bg-[var(--tg-theme-button-color)] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-opacity active:opacity-80"
          >
            <span className="text-lg">+</span> Пополнить
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-3xl">⭐️</p>
          <p className="text-xl font-bold mt-1">{profile?.stars ?? 0}</p>
          <p className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">Stars</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl">💎</p>
          <p className="text-sm font-semibold mt-1 leading-tight">
            {premiumDate ? `до ${premiumDate}` : 'Нет'}
          </p>
          <p className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">Premium</p>
        </div>
      </div>

      {/* Quick info */}
      <div className="card space-y-3">
        <p className="font-semibold">💳 Оплата банковской картой</p>
        <div className="space-y-2 text-sm text-[var(--tg-theme-hint-color)]">
          <p>✅ Безопасный платёж</p>
          <p>✅ Начисление автоматически</p>
          <p>✅ Поддержка 24/7</p>
        </div>
      </div>
    </div>
  )
}
