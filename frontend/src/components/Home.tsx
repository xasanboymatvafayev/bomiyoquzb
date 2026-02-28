'use client'

interface HomeProps { profile: any; onDeposit: () => void; onRefresh: () => void }

export default function Home({ profile, onDeposit }: HomeProps) {
  const balance = profile ? Number(profile.balance).toLocaleString('ru-RU') : null
  const premiumDate = profile?.premium_expire
    ? new Date(profile.premium_expire).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : null
  const name = profile?.username || 'пользователь'

  return (
    <div style={{ padding: '16px 16px 0' }}>
      <div className="afu" style={{ paddingTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'linear-gradient(135deg, #ff3cac, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 16px rgba(255,60,172,0.4)',
          }}>
            {name[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#f0f0f8' }}>Привет, {name}! 👋</p>
            <p style={{ fontSize: 12, color: '#6060a0', fontWeight: 600 }}>Ваш кошелёк</p>
          </div>
        </div>
      </div>

      <div className="afu2" style={{
        background: 'linear-gradient(135deg, #1a0a1e, #0a1520)',
        border: '1px solid rgba(255,60,172,0.2)',
        borderRadius: 24, padding: 20, marginBottom: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -30, right: -20,
          width: 120, height: 120,
          background: 'radial-gradient(circle, rgba(255,60,172,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ff3cac', marginBottom: 4 }}>
          💳 Баланс
        </p>
        {balance === null ? (
          <div className="shimmer" style={{ width: 140, height: 40, borderRadius: 8, marginBottom: 16 }} />
        ) : (
          <p style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-0.02em' }}>
            {balance} <span style={{ fontSize: 20, color: '#ff3cac' }}>₽</span>
          </p>
        )}
        <button onClick={onDeposit} className="btn-primary" style={{ width: 'auto', padding: '10px 22px', fontSize: 14 }}>
          <span style={{ fontSize: 18 }}>+</span> Пополнить
        </button>
      </div>

      <div className="afu3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div style={{
          background: 'linear-gradient(135deg, #0a1a0a, #061410)',
          border: '1px solid rgba(0,245,255,0.15)',
          borderRadius: 20, padding: 16, textAlign: 'center',
        }}>
          <span className="float" style={{ display: 'block', fontSize: 28, marginBottom: 6 }}>⭐️</span>
          <p style={{ fontSize: 24, fontWeight: 900, color: '#ffe600' }}>{profile?.stars ?? 0}</p>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#00f5ff', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Stars</p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #0a0a1a, #100614)',
          border: '1px solid rgba(168,85,247,0.15)',
          borderRadius: 20, padding: 16, textAlign: 'center',
        }}>
          <span className="float" style={{ display: 'block', fontSize: 28, marginBottom: 6, animationDelay: '0.5s' }}>💎</span>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#a855f7', lineHeight: 1.3 }}>
            {premiumDate ? `до ${premiumDate}` : 'Нет'}
          </p>
          <p style={{ fontSize: 11, fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Premium</p>
        </div>
      </div>

      <div className="afu4 card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 800, marginBottom: 12, fontSize: 15 }}>🚀 Почему выбирают нас?</p>
        {[
          { icon: '⚡️', text: 'Мгновенное зачисление', color: '#ffe600' },
          { icon: '🔒', text: 'Безопасный платёж', color: '#00ff87' },
          { icon: '💳', text: 'Оплата банковской картой', color: '#00f5ff' },
          { icon: '🛡', text: 'Поддержка 24/7', color: '#ff3cac' },
        ].map(({ icon, text, color }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>{icon}</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#c0c0e0' }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
