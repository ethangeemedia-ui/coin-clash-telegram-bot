import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { createChallenge, getUser, isVerified, listUsers, rememberJoin } from './store.js';
import { getCoinPriceUsd, getTokenBalance } from './solana.js';
import { buyKeyboard, verificationMessage } from './messages.js';

export const bot = new Telegraf(config.botToken);

function makeVerifyUrl(ctxOrUser) {
  const telegramId = ctxOrUser.from?.id || ctxOrUser.id || ctxOrUser.telegramId;
  const username = ctxOrUser.from?.username || ctxOrUser.username || '';
  const challenge = createChallenge({ telegramId, username });
  return `${config.publicBaseUrl}/verify?token=${encodeURIComponent(challenge.token)}`;
}

async function restrictUser(ctx, chatId, userId) {
  if (!config.restrictOnJoin) return;
  try {
    await ctx.telegram.restrictChatMember(chatId, userId, {
      permissions: {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
        can_manage_topics: false,
      },
    });
  } catch (err) {
    console.warn('restrictUser failed:', err.message);
  }
}

export async function unrestrictTelegramUser(telegramId) {
  if (!config.autoUnmuteOnVerify || !config.groupId) return;
  try {
    await bot.telegram.restrictChatMember(config.groupId, Number(telegramId), {
      permissions: {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false,
        can_manage_topics: false,
      },
    });
  } catch (err) {
    console.warn('unrestrictTelegramUser failed:', err.message);
  }
}

bot.start(async (ctx) => {
  const verifyUrl = makeVerifyUrl(ctx);
  const msg = verificationMessage({ verifyUrl });
  await ctx.reply(msg.text, msg.reply_markup);
});

bot.command('verify', async (ctx) => {
  const verifyUrl = makeVerifyUrl(ctx);
  const msg = verificationMessage({ verifyUrl });
  await ctx.reply(msg.text, msg.reply_markup);
});

bot.command('buy', async (ctx) => {
  await ctx.reply(`Buy or swap for ${config.coinSymbol}. The bot never asks for your seed phrase or private key.`, {
    reply_markup: buyKeyboard(),
  });
});

bot.command('pnl', async (ctx) => {
  if (!config.enablePnlTracker) {
    await ctx.reply('P/L tracker is currently disabled.');
    return;
  }
  const user = getUser(ctx.from.id);
  if (!user?.wallet) {
    const verifyUrl = makeVerifyUrl(ctx);
    await ctx.reply(`Connect and verify your wallet first.`, { reply_markup: { inline_keyboard: [[{ text: 'Verify wallet', url: verifyUrl }]] } });
    return;
  }

  try {
    const [{ balance }, price] = await Promise.all([
      getTokenBalance(user.wallet, config.tokenMint),
      getCoinPriceUsd(),
    ]);
    const priceText = price ? `$${price.toPrecision(6)}` : 'price unavailable';
    const currentValue = price ? balance * price : null;
    const initialBalance = Number(user.initialBalance || 0);
    const initialPrice = Number(user.initialPriceUsd || 0);
    const initialValue = initialPrice ? initialBalance * initialPrice : null;
    const delta = currentValue != null && initialValue != null ? currentValue - initialValue : null;
    const deltaText = delta == null ? 'N/A' : `${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}`;

    await ctx.reply(
      `📊 ${config.coinSymbol} wallet tracker\n\nWallet: ${user.wallet.slice(0, 4)}…${user.wallet.slice(-4)}\nBalance: ${balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${config.coinSymbol}\nCurrent price: ${priceText}\nEstimated current value: ${currentValue == null ? 'N/A' : `$${currentValue.toFixed(2)}`}\nEstimated change since verification: ${deltaText}\n\nNote: this is an estimated tracker from first verification only. It is not tax/accounting software and may not include historical buys, sells, transfers, or LP activity.`,
      { reply_markup: buyKeyboard() }
    );
  } catch (err) {
    await ctx.reply(`Could not load tracker right now: ${err.message}`);
  }
});

bot.command('status', async (ctx) => {
  const user = getUser(ctx.from.id);
  if (!user?.wallet) {
    await ctx.reply(`Not verified yet. Use /verify to unlock chat access.`);
    return;
  }
  await ctx.reply(`✅ Verified\nWallet: ${user.wallet.slice(0, 6)}…${user.wallet.slice(-6)}\nVerified at: ${user.verifiedAt}`);
});

bot.command('chatid', async (ctx) => {
  await ctx.reply(`Chat ID: ${ctx.chat.id}`);
});

bot.command('stats', async (ctx) => {
  const users = listUsers();
  const verified = users.filter((u) => u.verifiedAt).length;
  await ctx.reply(`Coin Clash bot stats\n\nVerified users: ${verified}\nStored users: ${users.length}\nRequired holding: ${config.minTokenBalance} ${config.coinSymbol}`);
});

bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members || []) {
    if (member.is_bot) continue;
    rememberJoin(member.id, ctx.chat.id);
    if (isVerified(member.id)) continue;
    await restrictUser(ctx, ctx.chat.id, member.id);
    const verifyUrl = makeVerifyUrl({ id: member.id, username: member.username });
    const msg = verificationMessage({ verifyUrl });
    await ctx.reply(`👋 Welcome ${member.first_name || 'player'} — verify ${config.coinSymbol} holdings to unlock chat.`, msg.reply_markup);
  }
});

bot.on('message', async (ctx, next) => {
  const chatType = ctx.chat?.type;
  if (!['group', 'supergroup'].includes(chatType)) return next();
  if (!ctx.from || ctx.from.is_bot) return next();
  if (ctx.message?.new_chat_members) return next();
  if (isVerified(ctx.from.id)) return next();

  if (config.deleteUnverifiedMessages) {
    try { await ctx.deleteMessage(); } catch {}
  }
  await restrictUser(ctx, ctx.chat.id, ctx.from.id);
  const verifyUrl = makeVerifyUrl(ctx);
  const msg = verificationMessage({ verifyUrl });
  try {
    await ctx.telegram.sendMessage(ctx.from.id, msg.text, msg.reply_markup);
  } catch {
    await ctx.reply(`Please DM the bot and use /verify to unlock chat access.`);
  }
});
