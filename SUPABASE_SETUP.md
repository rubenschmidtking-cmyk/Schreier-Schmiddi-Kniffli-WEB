# Supabase einrichten – Online-Spiel auf 2–4 iPhones

Der Online-Modus verwendet **Supabase Realtime Broadcast + Presence**. Es wird keine Tabelle und keine Datenbankmigration benötigt.

## 1. Kostenloses Projekt anlegen

1. Bei Supabase ein neues Projekt erstellen.
2. Projekt öffnen.
3. Unter **Project Settings → API** die Projekt-URL und den **öffentlichen Publishable/Anon Key** kopieren.

Wichtig: **Nie den `service_role` Key in eine Web-App oder in Netlify eintragen.**

## 2. Lokal

Im Projektordner eine `.env` anlegen:

```env
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLIC_KEY
```

Danach Dev-Server neu starten.

## 3. Netlify

In Netlify beim Projekt:

**Site configuration → Environment variables → Add a variable**

Diese zwei Variablen anlegen:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Anschließend einen neuen Deploy auslösen.

## 4. Test mit 2–4 iPhones

1. Beide iPhones öffnen dieselbe Netlify-URL.
2. iPhone A → **Raum erstellen**.
3. Code oder Teilen-Link an iPhone B senden.
4. iPhone B öffnet den Link oder gibt den 5-stelligen Code ein.
5. Sobald `2/2 verbunden` angezeigt wird, startet der Host das Match.
6. Beide Spieler würfeln **parallel**.
7. Die nächste Runde beginnt, sobald beide Spieler ein Feld eingetragen haben.

## Verhalten bei iOS im Hintergrund

iOS kann WebSocket-Verbindungen pausieren, sobald Safari/PWA länger im Hintergrund liegt. Deshalb synchronisiert die App beim Zurückkehren erneut den aktuellen Spielzustand. Für ein flüssiges Match sollten beide Spieler die App während der Runde geöffnet lassen.
