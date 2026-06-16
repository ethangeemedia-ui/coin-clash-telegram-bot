import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { createChallenge, getUser, isVerified, listUsers, rememberJoin } from './store.js';
import { getCoinPriceUsd, getTokenBalance } from './solana.js';
import {
  buildExtra,
  buyKeyboard,
  buyMessage,
  groupWelcomeMessage,
  menuMessage,
  verificationMessage,
} from './messages.js';

export const bot = new Telegraf(config.botToken);

function makeVerifyUrl(ctxOrUser) {
  const telegramId = ctxOrUser.from?.id || ctxOrUser.id || ctxOrUser.telegramId;
  const username = ctxOrUser.from?.username || ctxOrUser.username || '';
  const challenge = createChallenge({ telegramId, username });
  return `${config.publicBaseUrl}/verify?token=${encodeURIComponent(challenge.token)}`;
}

async function replyCard(ctx, card, { photo = true } = {}) {
  const extra = buildExtra(card.reply_markup);
  if (photo && config.logoUrl) {
    try {
      await ctx.replyWithPhoto(config.logoUrl, {
        caption: card.text,
        parse_mode: 'HTML',
        reply_markup: card.reply_markup,
      });
      return;
    } catch (err) {
      console.warn('replyWithPhoto failed, falling back to text:', err.message);
    }
  }
  await ctx.reply(card.text, extra);
}

async function sendPrivateCard(telegramId, card, { photo = true } = {}) {
  if (photo && config.logoUrl) {
    try {
      await bot.telegram.sendPhoto(telegramId, config.logoUrl, {
        caption: card.text,
        parse_mode: 'HTML',
        reply_markup: card.reply_markup,
      });
      return;
    } catch (err) {
      console.warn('sendPhoto private failed, falling back to text:', err.message);
    }
  }
  await bot.telegram.sendMessage(telegramId, card.text, buildExtra(card.reply_markup));
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

async function sendTracker(ctx) {
  if (!config.enablePnlTracker) {
    await ctx.reply('P/L tracker is currently disabled.');
    return;
  }

  const user = getUser(ctx.from.id);
  if (!user?.wallet) {
    const verifyUrl = makeVerifyUrl(ctx);
    const card = verificationMessage({ verifyUrl });
    await ctx.reply('Connect and verify your wallet first.', buildExtra(card.reply_markup));
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
    const pct = delta != null && initialValue ? (delta / initialValue) * 100 : null;
    const pctText = pct == null ? 'N/A' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;

    await ctx.reply(
      `📊 <b>${config.coinSymbol} Wallet Tracker</b>\n\n` +
      `Wallet: <code>${user.wallet.slice(0, 6)}…${user.wallet.slice(-6)}</code>\n` +
      `Balance: <b>${balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${config.coinSymbol}</b>\n` +
      `Current price: ${priceText}\n` +
      `Estimated value: ${currentValue == null ? 'N/A' : `$${currentValue.toFixed(2)}`}\n` +
      `Change since verification: <b>${deltaText}</b> (${pctText})\n\n` +
      `<i>Estimate only. This is not tax/accounting software and may not include historical buys, sells, transfers, LP activity, or multiple wallets.</i>`,
      buildExtra(buyKeyboard())
    );
  } catch (err) {
    await ctx.reply(`Could not load tracker right now: ${err.message}`);
  }
}

bot.start(async (ctx) => {
  const verifyUrl = makeVerifyUrl(ctx);
  await replyCard(ctx, menuMessage({ verifyUrl }));
});

bot.command(['menu', 'help'], async (ctx) => {
  const verifyUrl = makeVerifyUrl(ctx);
  await replyCard(ctx, menuMessage({ verifyUrl }));
});

bot.command('verify', async (ctx) => {
  const verifyUrl = makeVerifyUrl(ctx);
  await replyCard(ctx, verificationMessage({ verifyUrl }));
});

bot.command('buy', async (ctx) => {
  await replyCard(ctx, buyMessage(), { photo: false });
});

bot.command('pnl', sendTracker);
bot.action('pnl', async (ctx) => {
  await ctx.answerCbQuery('Loading wallet tracker...').catch(() => {});
  await sendTracker(ctx);
});

bot.command('status', async (ctx) => {
  const user = getUser(ctx.from.id);
  if (!user?.wallet) {
    const verifyUrl = makeVerifyUrl(ctx);
    await ctx.reply(`Not verified yet. Use /verify to unlock chat access.`, buildExtra(verificationMessage({ verifyUrl }).reply_markup));
    return;
  }
  await ctx.reply(
    `✅ <b>Verified</b>\n` +
    `Wallet: <code>${user.wallet.slice(0, 6)}…${user.wallet.slice(-6)}</code>\n` +
    `Verified at: ${user.verifiedAt}`,
    { parse_mode: 'HTML' }
  );
});

bot.command('chatid', async (ctx) => {
  await ctx.reply(
    `Chat ID:\n<code>${ctx.chat.id}</code>\n\nCopy that full number into Render as TELEGRAM_GROUP_ID.`,
    { parse_mode: 'HTML' }
  );
});

bot.command('stats', async (ctx) => {
  const users = listUsers();
  const verified = users.filter((u) => u.verifiedAt).length;
  await ctx.reply(
    `⚔️ <b>Coin Clash Bot Stats</b>\n\n` +
    `Verified users: <b>${verified}</b>\n` +
    `Stored users: ${users.length}\n` +
    `Required holding: <b>${config.minTokenBalance} ${config.coinSymbol}</b>`,
    { parse_mode: 'HTML' }
  );
});

bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members || []) {
    if (member.is_bot) continue;
    rememberJoin(member.id, ctx.chat.id);
    if (isVerified(member.id)) continue;
    await restrictUser(ctx, ctx.chat.id, member.id);
    const verifyUrl = makeVerifyUrl({ id: member.id, username: member.username });
    const card = groupWelcomeMessage({ verifyUrl, firstName: member.first_name || 'player' });
    await ctx.reply(card.text, buildExtra(card.reply_markup));
    try {
      await sendPrivateCard(member.id, verificationMessage({ verifyUrl }));
    } catch {
      // User may not have opened a DM with the bot yet.
    }
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
  const card = verificationMessage({ verifyUrl });
  try {
    await sendPrivateCard(ctx.from.id, card);
  } catch {
    const groupCard = groupWelcomeMessage({ verifyUrl, firstName: ctx.from.first_name || 'player' });
    await ctx.reply(groupCard.text, buildExtra(groupCard.reply_markup));
  }
});
