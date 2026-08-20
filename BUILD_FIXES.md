# Build Fixes – V3

Dieser Stand behebt die bisher in Netlify aufgetretenen Fehler:

- `TS18003: No inputs were found ... ["src"]` -> vollständiger `src/`-Ordner enthalten.
- `TS5096: allowImportingTsExtensions ...` -> `noEmit: true` in `tsconfig.node.json`.
- `ImportMeta.env` unbekannt -> `src/vite-env.d.ts` referenziert `vite/client`.
- `virtual:pwa-register` Typen fehlen -> `src/vite-env.d.ts` referenziert `vite-plugin-pwa/client`.
- `supabase is possibly null` -> Supabase-Client wird in `OnlineMatch.tsx` lokal geprüft und danach sicher verwendet.

## GitHub

Nach dem Entpacken den **Inhalt dieses Ordners** ins Root des GitHub-Repositories hochladen. Dort müssen direkt `src/`, `public/`, `package.json`, `netlify.toml` usw. sichtbar sein.

## Netlify

Build command: `npm run build`
Publish directory: `dist`
Node: `22`

Für Online Multiplayer zusätzlich setzen:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
