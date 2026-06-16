# Quick Install Checklist

## In Telegram

- [ ] Create bot with @BotFather
- [ ] Copy bot token
- [ ] Add bot to Coin Clash group
- [ ] Promote bot to admin
- [ ] Enable restrict members permission
- [ ] Enable delete messages permission
- [ ] Send `/chatid` in the group after bot is running

## In Render

- [ ] Create new Web Service
- [ ] Connect GitHub repo/folder
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Add environment variables
- [ ] Deploy
- [ ] Set `PUBLIC_BASE_URL` to Render URL
- [ ] Redeploy

## Required env values

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_GROUP_ID=
PUBLIC_BASE_URL=
TOKEN_MINT=GYtKLZA3vdChVYxmxaEsU2JqNw8dAkiLryDvKdCTpump
MIN_TOKEN_BALANCE=100
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Test

- [ ] Join with a test Telegram account
- [ ] Confirm bot mutes/restricts the test account
- [ ] Tap Verify
- [ ] Connect wallet with 100+ $COIN
- [ ] Sign message
- [ ] Confirm bot unmutes test account
- [ ] Test `/buy`
- [ ] Test `/pnl`
