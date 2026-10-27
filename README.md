# RF Online Tools

Source repository for **RF Online Tools**.

Production:
https://rfonlinetools.vercel.app/

## Deployment

GitHub is the source of truth. Vercel deploys the `main` branch.

Store credentials only in **Vercel → Project Settings → Environment Variables**.

Required variables:

- `RFTOOL_USERNAME`
- `RFTOOL_PASSWORD`
- `RFTOOL_SESSION_SECRET`

Never commit a real password, session secret, or local `.env` file.

## Current Tool

### DDS Generator
- DXT1 / BC1 DDS input
- 64×64 icon slots
- Zero-based DB index
- Photoshop Slice # = DB index + 1
- Sequential batch icon replacement
- DXT1A / BC1 1-bit alpha export
- DDS and replacement images are processed locally in the browser

## Production

https://rfonlinetools.vercel.app/
