import { config } from './config.js';

export function verificationMessage({ verifyUrl }) {
  return {
    text: `⚔️ Welcome to Coin Clash.\n\nTo unlock chat access, prove you hold at least ${config.minTokenBalance} ${config.coinSymbol}.\n\nTap Verify, connect your Solana wallet, sign the message, and the bot will unlock chat access automatically.`,
    reply_markup: {
      inline_keyboard: [
        [{ text: `Verify ${config.coinSymbol} holdings`, url: verifyUrl }],
        [
          { text: `Buy ${config.coinSymbol}`, url: config.pumpFunLink },
          { text: 'Play Coin Clash', url: config.playLink },
        ],
      ],
    },
  };
}

export function buyKeyboard() {
  return {
    inline_keyboard: [
      [{ text: `Buy ${config.coinSymbol} on Pump.fun`, url: config.pumpFunLink }],
      [{ text: `Swap on Jupiter`, url: config.jupiterSwapLink }],
      [{ text: 'Play Coin Clash', url: config.playLink }],
    ],
  };
}

export function verifiedText(balance) {
  return `✅ Verified. You hold ${balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${config.coinSymbol}. Chat access is now unlocked.`;
}

export function notEnoughText(balance) {
  return `❌ You currently hold ${balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${config.coinSymbol}. Minimum required: ${config.minTokenBalance} ${config.coinSymbol}.`;
}
