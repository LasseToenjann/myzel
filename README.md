# MYZEL — Das stille Netz

Ein entspanntes Incremental-Game über ein Pilzgeflecht unter dem Waldboden.
Du zersetzt, wächst, verzweigst dich — und irgendwann durchziehst du ganze Biome.

**Spielen:** https://lassetoenjann.github.io/myzel/

Läuft komplett im Browser, ohne Konto, ohne Server. Der Spielstand liegt lokal
im Browser und lässt sich als Text exportieren.

---

## Die Idee

Ein Skilltree ist eigentlich schon ein Netzwerk — also liegt es nahe, ein Spiel
zu bauen, in dem das Netzwerk auch die Erzählung ist. Prestige heißt hier
*Sporenflug*, Offline-Wachstum ist einfach die Nacht, und der Skilltree ist das
Myzel selbst.

Die wichtigste Design-Entscheidung: **Der Skillbaum wird nie zurückgesetzt.**
Seine Punkte kommen aus dem *Reifegrad*, der auf der insgesamt jemals erzeugten
Biomasse beruht. Egal was du tust — du gehst immer vorwärts. Kein Verlust, keine
Zeitfenster, kein Druck.

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

### Die sechs Äste

**Wachstum** (Produktion) · **Effizienz** (Kosten) · **Symbiose** (Synergien) ·
**Zersetzung** (Offline und Ruhe) · **Automatik** (Autokäufer) · **Tiefe** (Meta)

Die äußeren Ringe sind gesperrt, bis du in der Symbiose-Schicht Biome erschließt.

## Genre-Zutaten, die drin sind

- Goldene Sporen: driften über den Bildschirm, geben zeitlich begrenzte Boosts
- Offline-Wachstum mit anpassbarer Kappe und Effizienz
- Autokäufer je Struktur, Auto-Klick, automatischer Sporenflug
- Kaufmengen ×1 / ×10 / ×100 / MAX
- Meilensteine: jede 25. Struktur verdoppelt ihre Produktion
- Immer sichtbares nächstes Ziel — man weiß nie „was mache ich jetzt?"
- Herausforderungen mit Handicap und dauerhafter Belohnung
- Erfolge mit echtem Bonus (+2 % Produktion je Stück)
- Tastenkürzel, Statistik, Zahlenformat umstellbar, Export/Import
- Waldmeldungen als Flavour-Ticker

## Steuerung

| Taste | Wirkung |
|---|---|
| `1` – `8` | Struktur kaufen |
| `M` | alles Kaufbare kaufen |
| `Leertaste` | nähren (klicken) |
| `Q W E R T Z` | Reiter wechseln |
| `P` | Sporenflug |
| `S` | speichern |

## Aufbau

```
index.html          Grundgerüst und Bildschirme
css/style.css       gesamtes Aussehen
js/util.js          Zahlformatierung, DOM-Helfer
js/data.js          alle Inhalte: Strukturen, Skillbaum, Mutationen, Biome, Erfolge
js/state.js         Spielstand: anlegen, speichern, laden, migrieren
js/engine.js        Spiellogik: Werte berechnen, Ticken, Kaufen, Prestige
js/fx.js            wachsendes Hintergrund-Myzel, Partikel, Toasts, Ton
js/ui.js            alle Reiter und der Skillbaum
js/leaderboard.js   Bestenliste (lokal, optional gemeinsam)
js/main.js          Startbildschirm, Spielschleife, Tasten
```

Kein Build, keine Abhängigkeiten. `index.html` öffnen genügt.

## Bestenliste

Standardmäßig ist die Bestenliste **rein lokal** — es gibt keine Netzwerkzugriffe.
Für eine gemeinsame Liste trägt man in `js/leaderboard.js` oben eine URL ein
(etwa einen eigenen Schlüssel bei textdb.online):

```js
const REMOTE_URL = 'https://textdb.online/DEIN-EIGENER-SCHLUESSEL/';
```

Ohne Eintrag funktioniert alles andere unverändert.

## Balance

Die Zahlen sind mit einer kopflosen Simulation geprüft (ein Bot spielt das Spiel
über hunderte Stunden). Zwei Dinge müssen dabei stimmen, sonst läuft ein
Incremental binnen Stunden ins Unendliche:

1. Das **Kostenwachstum** einer Struktur muss immer über dem Meilenstein-Wachstum
   von 2^(1/25) = 1,0281 pro Stück liegen — sonst trägt sich jede weitere
   Struktur selbst. Deshalb die Untergrenze von 1,10 in `engine.js`.
2. Die **Rückkopplung** Produktion → Sporen → Produktion muss konvergieren.
   Dafür sorgen ein gedämpfter Sporen-Exponent und ein weicher Deckel auf den
   Gesamtmultiplikator.

---

Gebaut mit [Claude Code](https://claude.com/claude-code).
