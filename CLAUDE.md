# Arbeitsanleitung

Einstieg für jede neue Sitzung an diesem Projekt. Der Aufbau steht in
[docs/TECHNIK.md](docs/TECHNIK.md), die Begründung im [KONZEPT.md](KONZEPT.md),
die Regeln in [docs/SPIELANLEITUNG.md](docs/SPIELANLEITUNG.md).

---

## Projekt

**MYZEL — Das stille Netz**, ein Incremental-Game im Browser.
Live: https://lassetoenjann.github.io/myzel/ · Repo: `LasseToenjann/myzel`

Kein Build, keine Abhängigkeiten. `index.html` öffnen genügt.

## Grundsätze

1. **Mobile und iPad zuerst.** Gespielt wird auf kleinen Bildschirmen. Bauen bei
   390 px, gegenprüfen bei 320 px, kein horizontaler Überlauf. Tippflächen
   mindestens 44 px.
2. **Nie Fortschritt wegnehmen.** Reifegrad und Skillbaum sinken unter keinen
   Umständen. Kein Reset im Spiel darf daran rühren.
3. **Kein Knoten, der ins Leere geht.** Wer etwas kaufen kann, muss auch etwas
   davon haben — dafür sorgt die Tabelle `GATE` in `js/data.js`.
4. **Inhalte gehören in `js/data.js`.** Strukturen, Skillknoten, Mutationen,
   Biome, Prüfungen, Erfolge. Die Logik in `engine.js` bleibt unangetastet.
5. **Alles auf Deutsch**, im Spiel wie im Code-Kommentar. Ruhiger Ton, keine
   Ausrufezeichen-Sprache.

## Vor jeder Änderung an Zahlen

**Simulation laufen lassen.** Ein Bot spielt das Spiel kopflos über hunderte
Stunden und meldet, wann welcher Reifegrad fällt. Zwei Rückkopplungen haben dieses
Spiel schon ins Unendliche getrieben — beide sind in
[docs/TECHNIK.md](docs/TECHNIK.md#balance-und-ihre-fallen) beschrieben.

Warnzeichen im Protokoll: 50 Reifegrade in wenigen Minuten. Das ist nie ein
Erfolgserlebnis, sondern immer ein Fehler.

Richtwerte für einen pausenlos und optimal spielenden Bot:

| Meilenstein | Zeit |
|---|---|
| erster Sporenflug | ~5 h |
| erste Symbiose | ~17 h |
| „Der Kern" | ~21 h |
| Reifegrad 160 | ~31 h |

## Fallstricke, die schon zugeschlagen haben

- **Oberfläche im Sekundentakt neu bauen.** Wer in einer `refresh`-Funktion
  `innerHTML` setzt, erzeugt Knöpfe und Eingabefelder zehnmal pro Sekunde neu —
  sie flackern und lassen sich nicht mehr bedienen. Bereiche einmal in `buildX()`
  aufbauen, danach nur `setText` / `setHTML` / `setW` verwenden.
- **Versionsparameter vergessen.** Die Verweise auf CSS und JS in `index.html`
  tragen `?v=…`. Ohne Hochzählen liefern Browser die alte Fassung.
- **Startkapital nach dem Sporenflug** darf nicht in `lifetime` oder `runTotal`
  fließen, sonst erzeugt jeder Flug aus dem Nichts Sporen.
- **Kostenwachstum unter 1,10.** Der Meilenstein wächst mit 1,0281 pro Stück —
  liegt das Kostenwachstum darunter, trägt sich jede Struktur selbst.
- **Favicon als `data:`-URI.** Zeigt der Browser an, Google nicht. Es muss eine
  echte Datei sein (`assets/favicon.svg`).

## Testen

Die Spiellogik ist vollständig aus der Browser-Konsole ansteuerbar (`S`, `E`, `UI`,
`Save` sind global). Damit lassen sich Export/Import, Kaufmengen, Meilensteine,
Prüfungen, goldene Sporen, Offline-Kappe und beide Prestige-Schichten prüfen, ohne
stundenlang zu spielen.

Immer gegenprüfen: 375×812 (Handy) und 768×1024 (iPad).

## Nach jeder Änderung

1. Simulation, falls Zahlen betroffen sind
2. `?v=` in `index.html` hochzählen
3. [docs/AENDERUNGEN.md](docs/AENDERUNGEN.md) ergänzen
4. betroffene Dokumente mitziehen

## Stand

Version 1.3 — Ast-Segmente wachsen mit dem Ausbau sichtbar nach außen. Davor:
drei Spielstand-Plätze mit Namenspflicht, automatischer Eintrag in die
Bestenliste samt Detailansicht, live erzeugte Musik, Skillbaum mit eingefärbten
Kreissegmenten je Ast und 21 Querverbindungen.

Tasten: `S` löst die Symbiose aus. Eine Taste fürs Speichern gibt es bewusst nicht —
das läuft automatisch.
