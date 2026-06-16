# Token-2022 Program ID Fix

This fixes the Render crash:

```text
Error: Invalid public key input
at file:///app/src/solana.js:6:31
```

The issue was not your TOKEN_MINT. The previous bot build had an invalid Token-2022 program ID constant in `src/solana.js`.

Correct Token-2022 program ID:

```text
TokenzQdBNbLqP5VEhdkAS6EPFJp26pVMZfXV2TfhoQ
```

Upload this package to your Telegram bot GitHub repo and redeploy with Clear build cache.
