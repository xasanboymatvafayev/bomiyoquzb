'use client'
import { useEffect } from 'react'

export default function PaymentCancel() {
  useEffect(() => {
    setTimeout(() => {
      window.Telegram?.WebApp?.close()
    }, 3000)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-4">
      <div className="text-7xl">❌</div>
      <h2 className="text-2xl font-bold">Платёж отменён</h2>
      <p className="text-[var(--tg-theme-hint-color)]">Возвращаемся в магазин...</p>
    </div>
  )
}
