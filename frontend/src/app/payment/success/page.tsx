'use client'
import { useEffect } from 'react'

export default function PaymentSuccess() {
  useEffect(() => {
    setTimeout(() => {
      window.Telegram?.WebApp?.close()
    }, 3000)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-4">
      <div className="text-7xl">✅</div>
      <h2 className="text-2xl font-bold">Оплата прошла!</h2>
      <p className="text-[var(--tg-theme-hint-color)]">Средства будут зачислены автоматически. Окно закроется через 3 секунды.</p>
    </div>
  )
}
