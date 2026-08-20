# V17 Multiplayer Deadlock Fix

## Behobenes Problem
In V16 konnte jedes iPhone seinen eigenen `turnIndex` weiterschalten. Wenn ein Supabase-Broadcast verspätet oder verloren ging, konnten die Geräte unterschiedliche aktive Spieler anzeigen. Dadurch blieb ein Match gelegentlich bei „Spieler X ist dran“ hängen, obwohl X bereits gewertet hatte.

## Neue Architektur
- Der aktive Spieler wird aus den tatsächlich ausgefüllten Scorefeldern aller Spieler abgeleitet.
- Der Zugwechsel benötigt kein separates, flüchtiges Turn-Event mehr.
- Jeder Client sendet alle 1,8 Sekunden einen aktuellen Player-Snapshot.
- Ein Score-Snapshot wird beim Eintragen zusätzlich mit kurzen Retries gesendet.
- Unmögliche oder unvollständige Progress-Zustände lösen `sync_request` aus; die UI sperrt Eingaben bis der Zustand wieder konsistent ist.
- Runde und Endgame werden ebenfalls aus dem Scorefortschritt abgeleitet.
- Nur der Besitzer eines Spielerzustands setzt seine Würfel beim nächsten eigenen Zug zurück. Andere Geräte erfinden keine Remote-Zustände mehr.
- `gameId` trennt Rematches voneinander und verhindert, dass verspätete Nachrichten eines alten Matches den neuen Spielstand überschreiben.

## Validierung
- TypeScript/TSX Syntax aller Source-Dateien geprüft: 0 Syntaxfehler.
- Deterministische Turn-Fälle für 2–4 Spieler geprüft.
- ZIP-Integrität geprüft.

Für einen vollständigen End-to-End-Nachweis bleibt ein echter Mehrgeräte-Test mit 2–4 iPhones und Supabase erforderlich.
