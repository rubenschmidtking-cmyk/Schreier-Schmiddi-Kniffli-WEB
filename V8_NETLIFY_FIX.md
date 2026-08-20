# V8 Netlify PWA Fix

This release fixes the Workbox precache build failure seen on Netlify.

Changes:
- Optimized `public/brand/schmiddi-schreier-spezial-master.png` from ~2.33 MB to ~1.6 MB (1024×1024 PNG).
- Added `workbox.maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` in `vite.config.ts` as a safety margin.
- Bumped app version to `1.2.1`.
- Gameplay, multiplayer round fix, scoring, branding, and dice UI are unchanged from V7.

Netlify build command remains `npm run build`, which resolves to `vite build`.
