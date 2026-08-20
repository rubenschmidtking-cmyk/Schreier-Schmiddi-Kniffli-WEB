# Finale Checkliste

## GitHub
- [ ] Neues leeres GitHub-Repository erstellen.
- [ ] Alle Dateien aus diesem Projektordner hochladen – inklusive `.github`, `.gitignore` und `.env.example`.
- [ ] Keine echte `.env`-Datei committen.

## Supabase Realtime
- [ ] Kostenloses Supabase-Projekt erstellen.
- [ ] Projekt-URL kopieren.
- [ ] Öffentlichen Publishable Key kopieren – niemals `service_role` verwenden.
- [ ] Prüfen, dass öffentliche Realtime Channels im Projekt erlaubt sind.

## Netlify
- [ ] Repository mit Netlify verbinden.
- [ ] `netlify.toml` verwenden; Build ist `npm run build`, Output ist `dist`.
- [ ] `VITE_SUPABASE_URL` als Environment Variable setzen.
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` als Environment Variable setzen.
- [ ] Deploy auslösen.

## iPhone
- [ ] Netlify-URL in Safari öffnen.
- [ ] Teilen → `Zum Home-Bildschirm`.
- [ ] Auf beiden iPhones dieselbe installierte PWA öffnen.
- [ ] Online: iPhone A erstellt Raum, iPhone B tritt per Code/Link bei.
- [ ] Host startet bei `2/2 verbunden`.

## Spielregeln – fest
- 5 Würfel, maximal 3 Würfe je Runde.
- 18 Kategorien / 18 Runden.
- Oberer Bonus: +35 ab 63.
- 2 Paare 20, Drilling 15, Vierling 25, Full House 25.
- Kleine Straße 30 (vier aufeinanderfolgende Zahlen).
- Große Straße 40 (fünf aufeinanderfolgende Zahlen).
- Kniffli 50.
- Alle gerade 20, alle ungerade 20.
- Exakter Wurf 15 = 15 bei Gesamtaugenzahl 15.
- Exakter Wurf 20 = 20 bei Gesamtaugenzahl 20.
- Chance = Augensumme.


## V7 release check
- [ ] `V7_DICE_FINAL.txt` is visible in GitHub root
- [ ] `package.json` version is `1.2.0`
- [ ] PWA icon is visible after removing/re-adding the app to the iPhone Home Screen
- [ ] Dice render ivory-white with black recessed pips
- [ ] Held dice keep their red outline and do not roll
- [ ] Online match advances from round 1 to round 2 and onward


## V9 Spezialbonus
- Jede gültige Wertung im unteren Teil, die direkt nach dem 1. Wurf eingetragen wird, erhält +5 Punkte.
- Der Bonus wird direkt zum Kategorienwert addiert und gilt auch für Chance, da Chance im unteren Teil liegt.
