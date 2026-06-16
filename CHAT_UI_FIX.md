# Chat UI Fix

This package fixes the Telegram bot display issue where messages appeared as plain text with no visible buttons.

## What changed

- Fixed Telegraf reply markup usage. Inline buttons are now passed under `reply_markup`, so Telegram shows them correctly.
- Added a richer `/start`, `/menu`, and `/verify` display with buttons:
  - Verify Wallet
  - Buy $COIN
  - Swap on Jupiter
  - Wallet Tracker
  - Play Coin Clash
- Added an optional logo card using `PUBLIC_BASE_URL/logo.png`.
- Added `/verify` web route so `https://your-bot.onrender.com/verify?token=...` loads the verification page correctly.
- Added better `/chatid` output for copying `TELEGRAM_GROUP_ID`.

## Deploy steps

1. Upload this full package to the `coin-clash-telegram-bot` GitHub repo.
2. Make sure these files replace the old ones:
   - `src/bot.js`
   - `src/messages.js`
   - `src/server.js`
   - `src/config.js`
   - `public/logo.png`
   - `.env.example`
3. In Render, run:
   - Manual Deploy
   - Clear build cache & deploy

## Important

Do not open the Render bot URL directly for verification. The correct verification page must include a token:

```text
https://coin-clash-telegram-bot.onrender.com/verify?token=...
```

Telegram creates this link automatically when users tap the Verify Wallet button.
