# Coin Clash Telegram Holder Bot

A simple Telegram group paywall/holder-gate bot for Coin Clash. New members must prove they hold at least **100 $COIN** before they can chat.

The bot never asks for seed phrases, private keys, or custody of funds. Users connect a Solana wallet in a verification page, sign a free message, and the backend checks their SPL token balance.

## Features

- Telegram group chat gate for `$COIN` holders
- Minimum balance check, default `100 $COIN`
- Solana wallet signature verification
- Automatic mute/restrict on join
- Automatic unmute after verification
- `/verify`, `/buy`, `/pnl`, `/status`, `/stats`, `/chatid` commands
- Pump.fun and Jupiter buy buttons
- Estimated P/L tracker from first verification forward
- Easy Render/VPS deployment

## Important limitation about P/L

The included P/L tracker is an **estimate from first verification forward**. It checks the verified wallet's current token balance and optionally uses DexScreener pricing. It is not tax/accounting software and does not fully reconstruct historical buys, sells, swaps, transfers, LP activity, or multiple wallets.

For a true portfolio-grade P/L tracker, connect a professional wallet transaction indexer later, such as Helius Enhanced Transactions, Birdeye, SolanaTracker, Nansen, or your own indexed database.

## Setup

### 1. Create a Telegram bot

1. Open Telegram.
2. Message `@BotFather`.
3. Run `/newbot`.
4. Copy the bot token.

### 2. Add the bot to your group

1. Add the bot to your group.
2. Promote it to admin.
3. Give it permission to:
   - restrict members
   - delete messages
   - invite users, optional
   - manage chat, optional

For best results, use a supergroup.

### 3. Get the group ID

Temporarily run the bot, add it to the group, then send:

```text
/chatid
```

Copy the returned chat ID. It usually starts with `-100`.

### 4. Configure environment variables

Copy `.env.example` to `.env` locally, or add these in Render's Environment tab.

Minimum required values:

```env
TELEGRAM_BOT_TOKEN=your_botfather_token
TELEGRAM_GROUP_ID=-1001234567890
PUBLIC_BASE_URL=https://your-bot-domain.com
TOKEN_MINT=GYtKLZA3vdChVYxmxaEsU2JqNw8dAkiLryDvKdCTpump
MIN_TOKEN_BALANCE=100
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PUMP_FUN_LINK=https://pump.fun/coin/GYtKLZA3vdChVYxmxaEsU2JqNw8dAkiLryDvKdCTpump
JUPITER_SWAP_LINK=https://jup.ag/swap/SOL-GYtKLZA3vdChVYxmxaEsU2JqNw8dAkiLryDvKdCTpump
COIN_CLASH_PLAY_LINK=https://www.coinclash.online/play
```

Use a private Helius/QuickNode/Alchemy RPC for production so token balance checks do not get rate-limited.

### 5. Install and run

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000/healthz
```

### 6. Deploy to Render

Create a new Render Web Service from this repo/folder.

Use:

```text
Build command: npm install
Start command: npm start
```

Add the environment variables from `.env.example` in Render.

After deployment, set:

```env
PUBLIC_BASE_URL=https://your-render-service.onrender.com
```

Then redeploy.

## User flow

1. User joins your Telegram group.
2. Bot restricts them from chatting.
3. Bot sends a verification button.
4. User connects wallet and signs a message.
5. Server verifies signature and token balance.
6. If wallet holds at least 100 $COIN, bot unmutes the user.

## Commands

```text
/verify  - Get a wallet verification link
/buy     - Buy/swap $COIN links
/pnl     - Estimated token P/L tracker
/status  - See your verification status
/stats   - Admin-friendly stored verification count
/chatid  - Prints the current Telegram chat ID
```

## Security notes

- Never ask users for seed phrases or private keys.
- Keep `TELEGRAM_BOT_TOKEN` private.
- Use HTTPS for `PUBLIC_BASE_URL` in production.
- Give the bot only the Telegram admin permissions it needs.
- Use a reliable Solana RPC that supports `getParsedTokenAccountsByOwner` / `getTokenAccountsByOwner`.

## Buy button behavior

The bot does not custody funds or execute swaps internally. It sends users to Pump.fun or Jupiter so they can buy directly with their own wallet.
