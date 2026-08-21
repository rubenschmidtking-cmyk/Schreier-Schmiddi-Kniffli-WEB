# Schmiddi & Schreier Dice Dash – V18 Hardened

**Version 1.9.0** · Multiplayer-Hardening mit Host-Authority, Protokollschutz, monotonen Score-Snapshots und robustem Reconnect.

# Schmiddi & Schreier Dice Dash 🎲

Eine iPhone-optimierte Progressive Web App (PWA) für unser Spezial-Kniffel.

## Spielmodi

- **Gegen Schmiddi CPU** – Easy, Normal oder Psycho
- **2–4 iPhones online** – beide spielen dieselbe Runde nacheinander über einen Raumcode
- **Pass & Play** – zwei Spieler auf einem iPhone

## Spezial-Regeln

Der obere Teil bleibt klassisch. Ab **63 Punkten** gibt es **35 Bonuspunkte**.

Der untere Teil:

- 2 Paare = 15
- Drilling = Summe aller 5 Würfel bei mindestens 3 gleichen
- Vierling = Summe aller 5 Würfel bei mindestens 4 gleichen
- Full House = 25
- Kleine Straße = 30
- Große Straße = 40
- Dice Dash = 50
- Alle gerade = 15
- Alle ungerade = 15
- Exakter Wurf 20 = 20
- Chance = Augensumme

Es gibt **18 Wertungsfelder**. Das Spiel endet erst, wenn beide Spielblöcke vollständig ausgefüllt sind.

## Tech Stack

- React + TypeScript
- Vite
- PWA / Service Worker via `vite-plugin-pwa`
- Supabase Realtime für den Online-Modus
- Netlify für kostenloses Hosting
- Keine Datenbank nötig

## Lokal starten

```bash
npm install
cp .env.example .env
npm run dev
```

CPU und Pass & Play funktionieren auch ohne Supabase. Für Online-Matches die Supabase-Variablen in `.env` eintragen.

## Vor GitHub-Upload

Die Datei `.env` **nicht** committen. Sie ist bereits in `.gitignore`.

```bash
git init
git add .
git commit -m "Initial Schmiddi & Schreier Dice Dash PWA"
git branch -M main
git remote add origin DEINE_GITHUB_REPO_URL
git push -u origin main
```

## Netlify

Siehe [`NETLIFY_DEPLOY.md`](./NETLIFY_DEPLOY.md).

## Supabase / 2–4 iPhones

Siehe [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

## Auf dem iPhone installieren

1. Die Netlify-URL in **Safari** öffnen.
2. Teilen-Symbol antippen.
3. **Zum Home-Bildschirm** wählen.
4. Dice Dash startet danach als eigenständige Vollbild-PWA.

## Qualität prüfen

```bash
npm test
npm run build
```

## Für Claude weiterentwickeln

Der vollständige Übergabe-Prompt steht in [`CLAUDE_PROMPT.md`](./CLAUDE_PROMPT.md).

## Netlify TypeScript Fix (2026-08-19)
This package includes `src/vite-env.d.ts` with Vite/PWA client typings and a null-safe Supabase Realtime cleanup in `OnlineMatch.tsx`.

## V6 Brand Final
This package includes the final **Schmiddi & Schreier Dice Dash** app icon and a complete blue/red/gold visual refresh across the home screen, dice tray, score block, multiplayer lobby, modals and result screen. The V5 multiplayer round-advance fix remains included.

Deployment marker: `V6_BRAND_FINAL.txt`


## V7 Dice Final
The app icon and blue/red/gold brand system remain integrated. Dice have been upgraded to a physical ivory-white look inspired by classic real dice: rounded/beveled edges, recessed glossy black pips, specular highlights, varied resting angles and stronger contact shadows. The V5 multiplayer round-advance fix remains included.

Deployment marker: `V7_DICE_FINAL.txt`


## V9 Spezialbonus
- Jede gültige Wertung im unteren Teil, die direkt nach dem 1. Wurf eingetragen wird, erhält +5 Punkte.
- Der Bonus wird direkt zum Kategorienwert addiert und gilt auch für Chance, da Chance im unteren Teil liegt.

## V17 Multiplayer-Stabilität
Der Online-Modus leitet den aktiven Zug jetzt deterministisch aus dem Score-Fortschritt aller Spieler ab. Verpasste Realtime-Events werden durch periodische Snapshots und automatische Resyncs geheilt. Details: `V17_MULTIPLAYER_FIX.md`.
