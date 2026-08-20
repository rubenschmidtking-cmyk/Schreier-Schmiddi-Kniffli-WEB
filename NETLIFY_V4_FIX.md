# V4 Netlify Fix

This version addresses all errors seen in the previous Netlify logs.

## Included fixes
- `src/vite-env.d.ts` references `vite/client` and `vite-plugin-pwa/client`.
- `tsconfig.app.json` explicitly includes both type packages.
- `vite-plugin-pwa` is present in devDependencies.
- `OnlineMatch.tsx` stores the nullable Supabase client in a local non-null `client` after the guard.
- Production deploy uses `vite build`; `npm run typecheck` remains available separately.

## Verify the correct GitHub version
In the repository root you must see `V4_DEPLOY_MARKER.txt`. Open `package.json` and confirm:

```json
"build": "vite build"
```

If Netlify's log still says `> tsc -b && vite build`, Netlify is building an older GitHub commit.

## Netlify
Build command: `npm run build`
Publish directory: `dist`
Then use **Clear cache and deploy site**.
