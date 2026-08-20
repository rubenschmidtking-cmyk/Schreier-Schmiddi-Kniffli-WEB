# Prompt für Claude Code – Schreier Schmiddi Kniffli

Du übernimmst ein bestehendes, lauffähiges GitHub-Projekt namens **„Schreier Schmiddi Kniffli“**. Es ist eine iOS-optimierte Progressive Web App für ein eigenes Kniffel-Regelwerk. Arbeite **direkt auf der vorhandenen Codebasis** und behandle sie als Source of Truth. Lies zuerst `README.md`, `GAME_SPEC.md`, `src/lib/rules.ts`, `src/lib/scoring.ts`, `src/lib/game.ts`, `src/lib/cpu.ts` und die vorhandenen UI-Komponenten vollständig.

## Ziel

Entwickle die App von einem starken MVP zu einer **polierten, extrem hochwertigen iPhone Game-PWA**, die sich visuell und haptisch wie ein natives Casual Game anfühlt, aber weiterhin kostenlos über **GitHub + Netlify** deploybar bleibt. Online-Matches zwischen 2–4 iPhones laufen über **Supabase Realtime**.

## Unveränderliche Spielregeln

Es gibt 5 Würfel, maximal 3 Würfe pro Runde und 18 Runden. Nach jedem Wurf dürfen Würfel gehalten werden. Pro Runde wird genau eine freie Kategorie gefüllt.

Oberer Teil:
- Einser bis Sechser = jeweilige Augensumme
- Bonus = 35 Punkte ab 63 Punkten im oberen Teil

Unterer Teil:
- 2 Paare = 20
- Drilling = Summe aller 5 Würfel bei mindestens 3 gleichen
- Vierling = Summe aller 5 Würfel bei mindestens 4 gleichen
- Full House = 25
- Kleine Straße = 30
- Große Straße = 40
- Kniffli = 50
- Alle gerade = 15
- Alle ungerade = 15
- Exakter Wurf 15 = 15, wenn Gesamtaugenzahl exakt 15
- Exakter Wurf 20 = 20, wenn Gesamtaugenzahl exakt 20
- Chance = Summe aller Würfel

Diese Werte oder Bedeutungen **nicht verändern**, außer ich fordere es ausdrücklich.

## Spielmodi

1. **Spieler vs. Schmiddi CPU**
   - CPU spielt ihre Runde nacheinander zum Menschen.
   - Difficulty: Easy, Normal, Psycho.
   - Psycho soll strategisch stärker werden: Wahrscheinlichkeiten, Opportunitätskosten offener Felder, Bonusziel im oberen Block und sinnvolles Streichen berücksichtigen.

2. **Online 1 vs. 1 auf 2–4 iPhones**
   - Spieler A erstellt einen 5-stelligen Raumcode.
   - Spieler B tritt per Code oder Share-Link bei.
   - Beide spielen die aktuelle Runde nacheinander.
   - Sobald beide ein Feld gewählt haben, beginnt die nächste Runde.
   - Realtime über Supabase Broadcast + Presence.
   - Reconnect/Resync muss robust sein, insbesondere wenn iOS eine PWA im Hintergrund pausiert.
   - Keine geheimen Keys im Frontend. Nur öffentliche Browser-safe Supabase Keys.

3. **Pass & Play** auf einem Gerät als Zusatzmodus.

## Design Direction

Keine generische Bootstrap-/Dashboard-Optik. Die App soll eine klare eigene Identität haben:

- dunkles tiefes Bottle-Green / Kneipen-/Club-Feeling
- warmes cremefarbenes Papier für den Scoreblock
- kräftiges Orange als primäre Action-/Hold-Farbe
- Lime nur als seltenes Success-/Highlight-Signal
- fette, enge Display-Typografie für `SCHREIER SCHMIDDI KNIFFLI`
- Scoreblock erinnert an einen echten Kniffelblock, ist aber vollständig interaktiv
- keine Emoji-Würfel im eigentlichen Gameinterface
- iOS Safe Areas (`env(safe-area-inset-*)`) immer beachten
- 44px+ Touch Targets
- Portrait auf iPhone priorisieren, responsive bis mindestens 320px Breite
- `100dvh`, keine kaputten Safari-Viewport-Hacks
- keine UI, die Hover erfordert

## Dice Experience – höchste Priorität

Die Würfel sollen das stärkste Element der App sein. Entwickle die vorhandene Animation weiter:

- visuell echte Würfel mit Pips
- physisch wirkendes Tumble/Bounce statt einfacher Rotation
- gestaffelte Animation je Würfel
- während des Rollens schnell wechselnde Augen
- glaubwürdiger finaler Impact
- Tap-to-hold mit klarer State-Änderung
- gehaltene Würfel dürfen beim nächsten Wurf nicht animieren/ändern
- Roll-Sound + dezentes Haptic/Vibration Feedback, sofern Browser unterstützt
- Shake-to-Roll optional; auf iOS Permission nur durch klare User-Geste anfragen
- `prefers-reduced-motion` respektieren
- Kniffli = besondere Celebration (Konfetti, Score-Pop, Haptic), nicht kitschig

Keine kopierte Grafik oder 1:1-Nachbildung einer bestehenden Dice-App. Nutze bewährte Interaktionsmuster, aber ein eigenes visuelles System.

## Score Sheet

Das Scoresheet ist **das Game Interface**, kein nachgelagerter Statistikscreen.

- eigene Spalte und Gegnerspalte immer sichtbar
- bereits gesetzte Punkte klar, aber ruhig
- freie Felder zeigen nach einem Wurf den aktuell möglichen Score (`+30`, `+12`, `0`)
- Tap auf freien Score = Auswahl
- bei 0 Punkten vor dem Streichen bestätigen
- obere Zwischensumme, Bonus, obere Gesamtpunkte, untere Gesamtpunkte, Gesamtpunkte live
- deutliche Abschnittstrennung Oberer/Unterer Teil
- spielbar ohne horizontales Scrollen auf normalem iPhone

## Architektur

Behalte TypeScript strict. Trenne weiterhin:

- pure Rules/Scoring Logic
- Game Engine / State Transitions
- CPU
- Realtime Transport
- UI
- Feedback / device capabilities

Vermeide Business-Logik direkt in JSX. Bevorzuge kleine pure Funktionen und testbare State Transitions.

## Qualität / Tests

Nach jeder relevanten Änderung:

```bash
npm test
npm run build
```

Keine Änderung als fertig bezeichnen, wenn TypeScript Build oder Tests fehlschlagen.

Füge Tests hinzu für:
- alle 19 Scorekategorien
- Randfälle kleine/große Straße
- Full House
- 1/2 Paare
- exakt 15/20
- Bonus ab genau 63
- Rundenwechsel
- gehaltene Würfel
- Online-State-Reconciliation, soweit sinnvoll ohne echte Netzwerkverbindung testbar

## PWA / Netlify

- Installierbar über Safari → Teilen → Zum Home-Bildschirm
- Standalone Display
- passende App Icons und `apple-touch-icon`
- Service Worker darf keine alten Builds dauerhaft festhalten
- `netlify.toml` beibehalten
- SPA Redirect auf `index.html`
- Environment Variables bleiben `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY`
- `.env` bleibt gitignored

## Online Robustness – gezielt verbessern

Prüfe den bestehenden `OnlineMatch` besonders kritisch. Verbessere:

- deterministische Runden-Synchronisierung
- kein doppeltes Advance bei Race Conditions
- State-Version oder monotonen Sequence Counter einführen
- Reconnect nach Background/Sleep
- Host/Guest Namen zuverlässig
- Rematch auf beiden Geräten
- Fehlerzustände, falls Gegner weg ist
- Presence Cleanup
- Schutz vor drittem Spieler im selben Raum
- verständliche Connection States

Wenn eine kleine Supabase-Tabelle den Online-Modus signifikant robuster machen würde, schlage sie **zuerst** vor und erkläre den Trade-off. Die Default-Lösung soll weiterhin ohne eigene Backend-Server funktionieren.

## Vorgehensweise

1. Repo vollständig analysieren.
2. Kurze Liste der größten aktuellen Qualitäts-/Architekturrisiken erstellen.
3. Dann die Verbesserungen direkt implementieren – nicht nur beschreiben.
4. Bestehende funktionierende Features nicht unnötig neu schreiben.
5. Nach jedem größeren Schritt Tests/Build ausführen.
6. Am Ende liefern:
   - konkrete Änderungen
   - offene Risiken
   - Test-/Build-Ergebnis
   - welche Dateien geändert wurden
   - nächste 3 sinnvollste Verbesserungen

Wichtig: Die App soll **Spaß machen und extrem schnell verständlich sein**. Im Zweifel weniger Menüs, mehr direktes Spielen.


## V7 visual direction (must preserve)
- Use the integrated original `Schmiddi & Schreier Spezial` app icon as the visual north star.
- Overall palette: classic royal blue, glossy red/white title accents, restrained gold, warm ivory score paper.
- Dice should look like physical classic white/ivory dice, not emoji or flat tiles: rounded/beveled corners, subtle plastic/ivory shading, recessed glossy black pips, contact shadows, slight per-die resting rotations and a tactile tumble/bounce animation.
- Preserve mobile performance and 5-dice readability on narrow iPhones.
- Do not remove the V5 round-advance fix or change scoring/multiplayer behavior while polishing visuals.


## V9 Spezialbonus
- Jede gültige Wertung im unteren Teil, die direkt nach dem 1. Wurf eingetragen wird, erhält +5 Punkte.
- Der Bonus wird direkt zum Kategorienwert addiert und gilt auch für Chance, da Chance im unteren Teil liegt.
