# AgroAide Mobile (Expo)

React Native / Expo app for Nigerian smallholder farmers: dashboard, farm fields, calendar, AI advisor, crop scanner, disease map, weather, and notifications.

## Stack

- Expo SDK 54, Expo Router, React Native
- Zustand + TanStack Query
- styled-components design system
- i18n: English, Hausa, Yoruba, Nigerian Pidgin

## Quick start

```bash
pnpm install
cp .env.example .env   # if present; otherwise create .env
# set EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000/api
pnpm start
```

Use a **dev client** build for push notifications and native modules (`npx expo start --dev-client`).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Laravel API base, e.g. `http://10.0.2.2:8000/api` (Android emulator) or LAN IP for a physical phone |
| `EXPO_PUBLIC_LOCATIONIQ_KEY` | Farm location autocomplete |
| `GOOGLE_MAPS_API_KEY` | Native maps (Android/iOS) |

**Secrets hygiene:** `.env` and `google-services.json` are gitignored. Do not commit Firebase or Maps keys.

## Architecture

See [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) for system diagram and data-honesty notes.

## Tests

```bash
node --import tsx --test src/utils/notificationRouting.test.ts
```

(or `pnpm exec node --import tsx --test src/utils/notificationRouting.test.ts`)

Covers notification deep-link routing used when farmers open weather / disease pushes.

## Main screens

| Route | Purpose |
|-------|---------|
| `(tabs)/dashboard` | Weather alert, tasks, soil proxies, forecast |
| `(tabs)/farm` | Fields + journal |
| `(tabs)/calendar` | Farm tasks + crop watches |
| `(tabs)/advisor` | Context-aware AI chat (+ voice) |
| `farm-scan` | Crop photo diagnosis + history |
| `outbreak-map` | Nearby disease clusters |
| `weather-detail` | Forecast + alerts |
| `market` | Market Eye nearest-market prices + trends |
| `notifications` | In-app inbox with deep links |

Offline: fields, tasks, journal creates, transactions, and boundaries queue in SQLite and sync via `/sync/delta` on reconnect.

## Evaluation write-up

Template for your FYP evaluation chapter: [`../docs/EVALUATION.md`](../docs/EVALUATION.md).
