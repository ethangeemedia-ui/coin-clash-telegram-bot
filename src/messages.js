import { config } from './config.js';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildExtra(reply_markup, extra = {}) {
  return {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
    reply_markup,
  };
}

export function verificationMessage({ verifyUrl }) {
  const coin = esc(config.coinSymbol);
  return {
    text:
      `⚔️ <b>Welcome to Coin Clash</b>\n\n` +
      `To unlock chat access, prove you hold at least <b>${config.minTokenBalance} ${coin}</b>.\n\n` +
      `Tap <b>Verify Wallet</b>, connect your Solana wallet, sign the free message, and the bot will unlock chat automatically.\n\n` +
      `🔐 <i>No seed phrase. No private key. No spending transaction.</i>`,
    reply_markup: {
      inline_keyboard: [
        [{ text: `✅ Verify Wallet`, url: verifyUrl }],
        [
          { text: `🪙 Buy ${config.coinSymbol}`, url: config.pumpFunLink },
          { text: '🎮 Play Game', url: config.playLink },
        ],
        [{ text: '📊 Wallet Tracker', callback_data: 'pnl' }],
      ],
    },
  };
}

export function groupWelcomeMessage({ verifyUrl, firstName = 'player' }) {
  const safeName = esc(firstName);
  const coin = esc(config.coinSymbol);
  return {
    text:
      `⚔️ <b>${safeName}, welcome to Coin Clash.</b>\n\n` +
      `This group is holder-gated. Verify <b>${config.minTokenBalance}+ ${coin}</b> to unlock chat.`,
    reply_markup: {
      inline_keyboard: [
        [{ text: `✅ Verify Wallet`, url: verifyUrl }],
        [
          { text: `🪙 Buy ${config.coinSymbol}`, url: config.pumpFunLink },
          { text: '🎮 Play', url: config.playLink },
        ],
      ],
    },
  };
}

export function menuMessage({ verifyUrl }) {
  const coin = esc(config.coinSymbol);
  return {
    text:
      `⚔️ <b>Coin Clash Gatekeeper</b>\n\n` +
      `Holder-gated access for the Coin Clash community.\n\n` +
      `Required: <b>${config.minTokenBalance} ${coin}</b>\n` +
      `Mint: <code>${esc(config.tokenMint)}</code>\n\n` +
      `Choose an option below.`,
    reply_markup: {
      inline_keyboard: [
        [{ text: `✅ Verify Wallet`, url: verifyUrl }],
        [
          { text: `🪙 Buy ${config.coinSymbol}`, url: config.pumpFunLink },
          { text: '🔁 Swap on Jupiter', url: config.jupiterSwapLink },
        ],
        [
          { text: '📊 Wallet Tracker', callback_data: 'pnl' },
          { text: '🎮 Play Coin Clash', url: config.playLink },
        ],
      ],
    },
  };
}

export function buyKeyboard() {
  return {
    inline_keyboard: [
      [{ text: `🪙 Buy ${config.coinSymbol} on Pump.fun`, url: config.pumpFunLink }],
      [{ text: `🔁 Swap on Jupiter`, url: config.jupiterSwapLink }],
      [{ text: '🎮 Play Coin Clash', url: config.playLink }],
    ],
  };
}

export function buyMessage() {
  const coin = esc(config.coinSymbol);
  return {
    text:
      `🪙 <b>Buy ${coin}</b>\n\n` +
      `Use the buttons below to buy or swap into ${coin}.\n\n` +
      `The bot will never ask for your seed phrase or private key.`,
    reply_markup: buyKeyboard(),
  };
}

export function verifiedText(balance) {
  return `✅ Verified. You hold ${balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${config.coinSymbol}. Chat access is now unlocked.`;
}

export function notEnoughText(balance) {
  return `❌ You currently hold ${balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${config.coinSymbol}. Minimum required: ${config.minTokenBalance} ${config.coinSymbol}.`;
}
