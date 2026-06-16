# Dockerfile Fix

Render was failing because the Dockerfile tried to copy `.npmrc`, but that hidden file was not uploaded to GitHub.

This version fixes that by removing `.npmrc` from the Docker `COPY` line and setting the npm registry directly in the Dockerfile.

## Upload

Replace your GitHub repo contents with this folder, especially:

- `Dockerfile`
- `package.json`
- `src/`
- `public/`

Then in Render:

- Manual Deploy → Clear build cache & deploy

## Build settings

If Render is using Docker, it will use the Dockerfile automatically.
If Render is not using Docker, use:

Build command: `npm install`
Start command: `npm start`
