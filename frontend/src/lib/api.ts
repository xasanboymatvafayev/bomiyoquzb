import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

const api = axios.create({ baseURL: API_URL })

export function getInitData(): string {
  if (typeof window === 'undefined') return ''
  return window.Telegram?.WebApp?.initData || ''
}

export async function fetchProfile() {
  const { data } = await api.get('/api/user/profile', {
    params: { init_data: getInitData() }
  })
  return data
}

export async function fetchHistory() {
  const { data } = await api.get('/api/user/history', {
    params: { init_data: getInitData() }
  })
  return data
}

export async function fetchLeaderboard() {
  const { data } = await api.get('/api/leaderboard')
  return data
}

export async function createDeposit(amount: number) {
  const { data } = await api.post('/api/deposit/order', {
    amount,
    init_data: getInitData()
  })
  return data
}

export async function orderStars(stars: number, username: string) {
  const { data } = await api.post('/api/stars/order', {
    stars,
    username,
    init_data: getInitData()
  })
  return data
}

export async function orderPremium(period: string, username: string) {
  const { data } = await api.post('/api/premium/order', {
    period,
    username,
    init_data: getInitData()
  })
  return data
}
