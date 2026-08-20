# Product Spec – Schreier Schmiddi Kniffli

## Kernidee

Mobile-first Würfelspiel, primär für iPhone. Die Scoresheet-Optik ist das zentrale Spielinterface: Nach jedem Wurf werden bei freien Kategorien direkt die möglichen Punkte angezeigt. Tippen auf einen Vorschlagswert trägt die Kategorie ein.

## Regeln

- 5 sechsseitige Würfel
- Maximal 3 Würfe pro Spieler und Runde
- Nach dem ersten Wurf dürfen beliebige Würfel gehalten/gelöst werden
- Pro Runde muss genau eine freie Kategorie gewählt werden
- 18 Wertungsfelder; Game Over erst bei vollständig ausgefüllten Spielblöcken
- Online spielen beide Spieler dieselbe Runde nacheinander
- Nächste Runde erst, wenn beide Spieler eingetragen haben

### Oberer Teil

Einser bis Sechser: Summe der Würfel mit entsprechender Augenzahl.
Bonus: 35 Punkte ab 63 Punkten im oberen Teil.

### Unterer Teil

| Kategorie | Bedingung | Punkte |
|---|---|---:|
| 2 Paare | 2 unterschiedliche Werte jeweils mindestens doppelt | 20 |
| Drilling | mindestens 3 gleiche | Summe aller 5 Würfel |
| Vierling | mindestens 4 gleiche | Summe aller 5 Würfel |
| Full House | exakt 2 + 3 gleiche | 25 |
| Kleine Straße | beliebige Folge aus 4 Zahlen | 30 |
| Große Straße | 1–5 oder 2–6 | 40 |
| Kniffli | 5 gleiche | 50 |
| Alle gerade | alle 5 Würfel sind 2/4/6 | 15 |
| Alle ungerade | alle 5 Würfel sind 1/3/5 | 15 |
| Exakter Wurf 15 | Augensumme exakt 15 | 15 |
| Exakter Wurf 20 | Augensumme exakt 20 | 20 |
| Chance | keine Bedingung | Augensumme |

## UX

- Portrait-first, safe-area-aware iOS Layout
- Maximal großer Touch-Target-Fokus
- Keine Hover-Abhängigkeiten
- Eigene Pip-Würfel statt Emoji-Würfel
- Roll-Animation: Tumble + Bounce + schnell wechselnde Augen
- Tap-to-hold: Würfel hebt sich an, orange Outline, HOLD-Pill
- Haptik über Web Vibration API, wo verfügbar
- optional Shake-to-Roll mit iOS Permission
- Kniffli: Konfetti + stärkeres Feedback
- Spielblock bleibt während des Spiels sichtbar
- Gegnerpunkte permanent sichtbar

## Online

- Raumcode: 5 Zeichen
- Host erstellt Raum, teilt Code/URL
- Guest tritt bei
- Presence zeigt 2/2
- Host startet
- Scores/Rundenstatus werden per Realtime Broadcast synchronisiert
- Wieder-Sync beim Zurückkehren aus dem Hintergrund

## Nicht ändern ohne explizite Produktentscheidung

- Name: `Schreier Schmiddi Kniffli`
- 19 Kategorien
- Kniffli = 50
- Kleine Straße = 30
- Große Straße = 40
- Bonus = 35 ab 63
- Parallelität im Online-Modus


## V9 Spezialbonus
- Jede gültige Wertung im unteren Teil, die direkt nach dem 1. Wurf eingetragen wird, erhält +5 Punkte.
- Der Bonus wird direkt zum Kategorienwert addiert und gilt auch für Chance, da Chance im unteren Teil liegt.
