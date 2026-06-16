import express from 'express';
import { config } from './config.js';
import { getChallenge, markChallengeUsed, upsertUser } from './store.js';
import { getCoinPriceUsd, getTokenBalance, verifyWalletSignature } from './solana.js';
import { unrestrictTelegramUser, bot } from './bot.js';
import { notEnoughText, verifiedText } from './messages.js';

function buildSignMessage(challenge) {
  return [
    'Coin Clash Telegram Verification',
    '',
    `Telegram ID: ${challenge.telegramId}`,
    `Token mint: ${config.tokenMint}`,
    `Required holding: ${config.minTokenBalance} ${config.coinSymbol}`,
    `Nonce: ${challenge.nonce}`,
    `Issued at: ${challenge.issuedAt}`,
    '',
    'Signing this message proves wallet ownership. It does not spend funds or grant transaction permission.',
  ].join('\n');
}

export function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static('public'));

  app.get('/healthz', (req, res) => {
    res.json({ ok: true, app: 'coin-clash-telegram-holder-bot', coin: config.coinSymbol, mint: config.tokenMint });
  });

  app.get('/api/config', (req, res) => {
    res.json({
      coinSymbol: config.coinSymbol,
      tokenMint: config.tokenMint,
      minTokenBalance: config.minTokenBalance,
      pumpFunLink: config.pumpFunLink,
      jupiterSwapLink: config.jupiterSwapLink,
      playLink: config.playLink,
    });
  });

  app.get('/api/challenge/:token', (req, res) => {
    const challenge = getChallenge(req.params.token);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found. Return to Telegram and tap Verify again.' });
    if (challenge.used) return res.status(410).json({ error: 'Challenge already used. Return to Telegram and tap Verify again.' });
    if (new Date(challenge.expiresAt).getTime() < Date.now()) return res.status(410).json({ error: 'Challenge expired. Return to Telegram and tap Verify again.' });
    res.json({
      token: challenge.token,
      telegramId: challenge.telegramId,
      message: buildSignMessage(challenge),
      coinSymbol: config.coinSymbol,
      tokenMint: config.tokenMint,
      minTokenBalance: config.minTokenBalance,
    });
  });

  app.post('/api/verify', async (req, res) => {
    const { token, publicKey, signatureBase64, message } = req.body || {};
    const challenge = token ? getChallenge(token) : null;
    if (!challenge) return res.status(404).json({ error: 'Challenge not found. Return to Telegram and tap Verify again.' });
    if (challenge.used) return res.status(410).json({ error: 'Challenge already used. Return to Telegram and tap Verify again.' });
    if (new Date(challenge.expiresAt).getTime() < Date.now()) return res.status(410).json({ error: 'Challenge expired. Return to Telegram and tap Verify again.' });

    const expected = buildSignMessage(challenge);
    if (message !== expected) return res.status(400).json({ error: 'Signed message did not match the expected verification message.' });

    const sigOk = verifyWalletSignature({ publicKey, message, signatureBase64 });
    if (!sigOk) return res.status(401).json({ error: 'Wallet signature could not be verified.' });

    try {
      const [{ balance }, priceUsd] = await Promise.all([
        getTokenBalance(publicKey, config.tokenMint),
        getCoinPriceUsd(),
      ]);
      if (balance < config.minTokenBalance) {
        return res.status(403).json({ error: notEnoughText(balance), balance });
      }

      markChallengeUsed(token);
      upsertUser({
        telegramId: challenge.telegramId,
        username: challenge.username || '',
        wallet: publicKey,
        balanceAtVerification: balance,
        initialBalance: balance,
        initialPriceUsd: priceUsd || null,
        verifiedAt: new Date().toISOString(),
      });

      await unrestrictTelegramUser(challenge.telegramId);
      try {
        await bot.telegram.sendMessage(challenge.telegramId, verifiedText(balance));
      } catch {}

      res.json({ ok: true, balance, message: verifiedText(balance) });
    } catch (err) {
      console.error('Verify error:', err);
      res.status(500).json({ error: `Verification failed: ${err.message}` });
    }
  });

  return app;
}
