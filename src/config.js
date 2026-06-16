import dotenv from 'dotenv';
dotenv.config();

function bool(name, fallback = false) {
  const v = process.env[name];
  if (v == null) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function num(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const publicBaseUrl = (process.env.PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const config = {
  port: num('PORT', 3000),
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  groupId: process.env.TELEGRAM_GROUP_ID || '',
  publicBaseUrl,
  botUsername: (process.env.BOT_USERNAME || '').replace(/^@/, ''),
  logoUrl: process.env.LOGO_URL || `${publicBaseUrl}/logo.png`,

  coinSymbol: process.env.COIN_SYMBOL || '$COIN',
  tokenMint: process.env.TOKEN_MINT || 'GYtKLZA3vdChVYxmxaEsU2JqNw8dAkiLryDvKdCTpump',
  minTokenBalance: num('MIN_TOKEN_BALANCE', 100),
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',

  pumpFunLink: process.env.PUMP_FUN_LINK || 'https://pump.fun/coin/GYtKLZA3vdChVYxmxaEsU2JqNw8dAkiLryDvKdCTpump',
  jupiterSwapLink: process.env.JUPITER_SWAP_LINK || 'https://jup.ag/swap/SOL-GYtKLZA3vdChVYxmxaEsU2JqNw8dAkiLryDvKdCTpump',
  playLink: process.env.COIN_CLASH_PLAY_LINK || 'https://www.coinclash.online/play',

  restrictOnJoin: bool('RESTRICT_ON_JOIN', true),
  deleteUnverifiedMessages: bool('DELETE_UNVERIFIED_MESSAGES', true),
  autoUnmuteOnVerify: bool('AUTO_UNMUTE_ON_VERIFY', true),
  enablePnlTracker: bool('ENABLE_PNL_TRACKER', true),
  dexscreenerPriceApi: bool('DEXSCREENER_PRICE_API', true),
};

export function requireConfig() {
  const missing = [];
  if (!config.botToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!config.groupId) missing.push('TELEGRAM_GROUP_ID');
  if (!config.publicBaseUrl) missing.push('PUBLIC_BASE_URL');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
