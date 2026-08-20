# GitHub → Netlify → iPhone

## A. GitHub

1. Auf GitHub ein **leeres Repository** erstellen, z. B. `schreier-schmiddi-kniffli`.
2. Den kompletten Inhalt dieses Ordners in das Repository hochladen.
3. `.env` niemals hochladen.

Alternativ per Terminal:

```bash
git init
git add .
git commit -m "Initial PWA"
git branch -M main
git remote add origin https://github.com/DEINNAME/schreier-schmiddi-kniffli.git
git push -u origin main
```

## B. Netlify

1. Bei Netlify anmelden.
2. **Add new project / Import an existing project**.
3. GitHub auswählen und das Repository verbinden.
4. Netlify erkennt durch `netlify.toml` automatisch:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Unter **Environment variables** die beiden Supabase-Werte hinzufügen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Deploy starten.

Nach dem Build erhältst du eine URL wie `dein-name.netlify.app`.

## C. iPhone

Auf beiden iPhones:

1. Netlify-Link in Safari öffnen.
2. Teilen → **Zum Home-Bildschirm**.
3. App-Icon antippen.

Danach lässt sich Kniffli im Vollbild wie eine normale App starten.

## D. Updates

Jeder Push auf den verbundenen GitHub-Branch löst automatisch einen neuen Netlify-Deploy aus. Die PWA aktualisiert den Service Worker automatisch.
