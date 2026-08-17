# MYZEL — Das stille Netz

Ein entspanntes Incremental-Game über ein Pilzgeflecht unter dem Waldboden.
Du zersetzt, wächst, verzweigst dich — und irgendwann durchziehst du ganze Biome.

**Spielen:** https://lassetoenjann.github.io/myzel/

Läuft komplett im Browser, ohne Konto und ohne Installation. Der Spielstand liegt
lokal im Browser und lässt sich als Text sichern. Nur die Bestenliste geht ins Netz
— und auch die erst, wenn man dort auf „Ergebnis senden" klickt.

---

## Wo steht was

| Ich möchte … | … dann hier |
|---|---|
| **spielen** | [lassetoenjann.github.io/myzel](https://lassetoenjann.github.io/myzel/) |
| **die Regeln verstehen** | [docs/SPIELANLEITUNG.md](docs/SPIELANLEITUNG.md) |
| **wissen, warum es so gebaut ist** | [KONZEPT.md](KONZEPT.md) |
| **am Code arbeiten** | [CLAUDE.md](CLAUDE.md) für Arbeitsweise und Stand · [docs/TECHNIK.md](docs/TECHNIK.md) für den Aufbau |
| **sehen, was sich geändert hat** | [docs/AENDERUNGEN.md](docs/AENDERUNGEN.md) |

## Die Idee in drei Sätzen

Ein Skilltree ist bereits ein Netzwerk — also liegt es nahe, ein Spiel zu bauen, in
dem das Netzwerk auch die Erzählung ist. Prestige heißt hier *Sporenflug*,
Offline-Wachstum ist einfach die Nacht, und der Skillbaum ist das Myzel selbst.
Die wichtigste Entscheidung: **Der Skillbaum wird nie zurückgesetzt** — egal was
du tust, du gehst immer vorwärts.

## Die Schichten

| Schicht | Mechanik | Wozu |
|---|---|---|
| 0 | Klicken → Biomasse | Rückmeldung ab Sekunde eins |
| 1 | 8 Strukturen mit Kostenskalierung, ×2 alle 25 Stück | die kurze Kaufschleife |
| 2 | **Reifegrad** aus der Lebenszeit-Biomasse → Wachstumspunkte | dauerhafter Fortschritt |
| 3 | **Skillbaum**: 72 Knoten, 6 Äste, radial, permanent | das Herzstück |
| 4 | **Sporenflug** (Prestige) → Sporen → 18 Mutationen | der erste große Schnitt |
| 5 | **Symbiose** (Meta-Prestige) → 8 Biome | öffnet gesperrte Ringe im Baum |
| — | Prüfungen, 59 Erfolge, Autokäufer, Offline-Wachstum | Nebenziele und Komfort |

## Steuerung

| Taste | Wirkung |
|---|---|
| `1` – `8` | Struktur kaufen |
| `M` | alles Kaufbare kaufen |
| `Leertaste` | nähren (klicken) |
| `Q W E R T Z` | Reiter wechseln |
| `P` | Sporenflug |
| `Y` | Symbiose |
| `S` | speichern |

Auf Tablet und Handy: ziehen zum Verschieben, zwei Finger zum Zoomen,
Doppeltipp setzt die Baumansicht zurück.

## Aufbau

```
index.html          Grundgerüst und Bildschirme
assets/             Favicon
css/style.css       gesamtes Aussehen
js/util.js          Zahlformatierung, DOM-Helfer
js/data.js          alle Inhalte: Strukturen, Skillbaum, Mutationen, Biome, Erfolge
js/state.js         Spielstand: anlegen, speichern, laden, migrieren
js/engine.js        Spiellogik: Werte berechnen, Ticken, Kaufen, Prestige
js/fx.js            wachsendes Hintergrund-Myzel, Partikel, Toasts, Ton
js/ui.js            alle Reiter und der Skillbaum
js/leaderboard.js   globale Bestenliste über textdb.online
js/main.js          Startbildschirm, Spielschleife, Tasten
```

Kein Build, keine Abhängigkeiten. `index.html` öffnen genügt.

## Bestenliste

Global über [textdb.online](https://textdb.online) — derselbe kostenlose
Key-Value-Speicher wie beim Wahlwächter. Sortiert wird nach Reifegrad, bei
Gleichstand nach der insgesamt erzeugten Biomasse. Details in
[docs/TECHNIK.md](docs/TECHNIK.md#bestenliste).

## Balance

Die Zahlen sind mit einer kopflosen Simulation geprüft: Ein Bot spielt das Spiel
über hunderte Stunden und meldet, wann welche Meilensteine fallen. Zwei Dinge
müssen dabei stimmen, sonst läuft ein Incremental binnen Stunden ins Unendliche —
beides steht ausführlich in [docs/TECHNIK.md](docs/TECHNIK.md#balance-und-ihre-fallen).
