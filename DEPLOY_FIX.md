# Render deploy fix

This version removes the old package-lock.json and adds .npmrc so Render installs from the public npm registry.

Render settings:

Build Command:

```bash
npm install
```

Start Command:

```bash
npm start
```

After uploading, use Manual Deploy -> Clear build cache & deploy.

If Render still says `Cannot find package dotenv`, it means the Build Command did not run or Render is using an old cached deploy. Clear build cache and deploy again.
