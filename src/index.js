import { config, requireConfig } from './config.js';
import { bot } from './bot.js';
import { createServer } from './server.js';

requireConfig();

const app = createServer();
const server = app.listen(config.port, () => {
  console.log(`Coin Clash Telegram Holder Bot listening on ${config.port}`);
  console.log(`Verification URL base: ${config.publicBaseUrl}`);
  console.log(`Token gate: ${config.minTokenBalance} ${config.coinSymbol} / ${config.tokenMint}`);
});

bot.launch().then(() => {
  console.log('Telegram bot launched with long polling.');
});

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  bot.stop(signal);
  server.close(() => process.exit(0));
}
