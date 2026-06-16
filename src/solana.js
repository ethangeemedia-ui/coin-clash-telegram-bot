import { Connection, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { config } from './config.js';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdYwZK5Z9hrZfrGomzDDBbU8GVE6MRF5o94VtP');

export const connection = new Connection(config.solanaRpcUrl, 'confirmed');

export function verifyWalletSignature({ publicKey, message, signatureBase64 }) {
  try {
    const pk = new PublicKey(publicKey);
    const messageBytes = new TextEncoder().encode(message);
    const sig = Buffer.from(signatureBase64, 'base64');
    return nacl.sign.detached.verify(messageBytes, sig, pk.toBytes());
  } catch (err) {
    console.warn('verifyWalletSignature failed:', err.message);
    return false;
  }
}

export async function getTokenBalance(ownerAddress, mintAddress) {
  const owner = new PublicKey(ownerAddress);
  const mint = new PublicKey(mintAddress);
  let total = 0;
  let decimals = null;

  const seenAccounts = new Set();

  // Some RPC providers behave differently for Token-2022 tokens, so query both programs.
  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    try {
      const res = await connection.getParsedTokenAccountsByOwner(owner, { programId }, 'confirmed');
      for (const account of res.value) {
        if (seenAccounts.has(account.pubkey.toBase58())) continue;
        const info = account.account.data.parsed?.info;
        if (info?.mint !== mint.toBase58()) continue;
        seenAccounts.add(account.pubkey.toBase58());
        const amount = info?.tokenAmount;
        if (amount?.uiAmountString) total += Number(amount.uiAmountString);
        if (typeof amount?.decimals === 'number') decimals = amount.decimals;
      }
    } catch (err) {
      console.warn(`Token account lookup failed for ${programId.toBase58()}:`, err.message);
    }
  }

  // Fallback: direct mint filter.
  if (seenAccounts.size === 0) {
    try {
      const res = await connection.getParsedTokenAccountsByOwner(owner, { mint }, 'confirmed');
      for (const account of res.value) {
        const info = account.account.data.parsed?.info;
        const amount = info?.tokenAmount;
        if (amount?.uiAmountString) total += Number(amount.uiAmountString);
        if (typeof amount?.decimals === 'number') decimals = amount.decimals;
      }
    } catch (err) {
      console.warn('Mint-filter token account lookup failed:', err.message);
      throw err;
    }
  }

  return { balance: total, decimals };
}

export async function getCoinPriceUsd() {
  if (!config.dexscreenerPriceApi) return null;
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${config.tokenMint}`;
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const pairs = Array.isArray(json?.pairs) ? json.pairs : [];
    const best = pairs
      .filter((p) => p?.chainId === 'solana' && p?.priceUsd)
      .sort((a, b) => Number(b?.liquidity?.usd || 0) - Number(a?.liquidity?.usd || 0))[0];
    return best ? Number(best.priceUsd) : null;
  } catch (err) {
    console.warn('Price lookup failed:', err.message);
    return null;
  }
}
