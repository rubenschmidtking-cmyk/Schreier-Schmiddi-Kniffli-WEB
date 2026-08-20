# V10 Final – Multiplayer Stability + Audio

## Online-Multiplayer

- Supabase Realtime nutzt `worker: true`, damit Heartbeats im Hintergrund robuster laufen.
- `heartbeatCallback` verbindet den Realtime-Client bei erkanntem Disconnect erneut.
- Der Room-Channel wird nach iOS/PWA Resume, `pageshow` und Netz-Reconnect neu aufgebaut.
- Exponentielles Reconnect-Backoff bei `CHANNEL_ERROR`, `TIMED_OUT` und `CLOSED`.
- Raum, Host/Gast-Rolle, Runde, eigener Spielstand, Gegner-Snapshot und Finished-State werden lokal auf dem iPhone gespeichert.
- Nach Reload/Background wird die Session aus `localStorage` wiederhergestellt und anschließend mit dem zweiten iPhone synchronisiert.
- Monotoner Sequence-Wert verhindert, dass verspätete Broadcasts einen neueren Zustand überschreiben.
- `sync_request` / `sync` übertragen beim Reconnect explizit Startstatus, Runde, Finished-State und aktuellen Spieler-Snapshot.
- Ein kurzfristiger Presence-Verlust beendet das Match nicht mehr.

## Audio

User-provided audio assets wurden für PWA/iPhone komprimiert:

- `public/sounds/dice-roll.mp3` – Würfelwurf, ca. 17 KB
- `public/sounds/score-lock.mp3` – erfolgreicher Punkte-Eintrag, ca. 20 KB

Beide respektieren den bestehenden Sound-Schalter.

## Regeln

Unverändert gegenüber V9:

- 18 Runden
- kein 1 Paar
- Drilling / Vierling = Summe aller fünf Würfel
- Alle gerade / Alle ungerade = 15
- Unterer Teil direkt nach Wurf 1 = +5 auf jede gültige Wertung
