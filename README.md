# 🚀 Telegram Stars & Premium Shop

Telegram WebApp + FastAPI Backend + Fragment to'lov tizimi

## 📁 Struktura

```
project/
├── backend/          # FastAPI backend
├── bot/              # aiogram Telegram bot
├── frontend/         # Next.js WebApp
├── nginx/            # Nginx config
├── docker-compose.yml
└── .env.example
```

## ⚙️ Sozlash

### 1. ENV fayl yaratish
```bash
cp .env.example .env
# .env faylni to'ldiring
```

### 2. SSL sertifikat (Let's Encrypt)
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

### 3. Deploy
```bash
docker-compose up -d --build
```

### 4. Nginx conf ichida `yourdomain.com` ni o'zingizning domenga almashtiring

## 🔗 API Endpointlar

| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /api/deposit/order | Balans to'ldirish |
| POST | /api/payment/fragment/callback | Fragment webhook |
| POST | /api/stars/order | Stars sotib olish |
| POST | /api/premium/order | Premium sotib olish |
| POST | /api/payment/arzonsstars/webhook | ArzonStars webhook |
| GET | /api/user/profile | Profil |
| GET | /api/user/history | Tranzaksiyalar tarixi |
| GET | /api/leaderboard | Reyting |

## 📱 WebApp bo'limlari

- **🏠 Bosh sahifa** — Balans, Stars, Premium muddat
- **⭐️ Stars** — 50/100/250/500/1000 yoki custom
- **💎 Premium** — 1/3/6/12 oylik
- **👤 Profil** — Tarix, Reyting, Referral

## 🔐 Xavfsizlik

- Telegram `initData` tekshiruvi
- Fragment va ArzonStars webhook signature tekshiruvi
- CORS faqat WebApp domaeni uchun
- HTTPS majburiy
