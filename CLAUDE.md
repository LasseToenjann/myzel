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
- **Freie Tabellen in `Save.merge()`.** `nodes` und `muts` stehen in `fresh()` als
  `{}`. Wer sie Feld für Feld auffüllt, übernimmt nichts — der Skillbaum war
  monatelang nach jedem Neuladen leer. Ganz übernehmen, nicht durchlaufen.
- **`+` und `%` in der Bestenliste.** textdb.online dekodiert den Wert zweimal und
  macht dabei aus `+` ein Leerzeichen. `1e+27` wird zu `1e 27`, das JSON ist
  kaputt, und ein einziger solcher Eintrag legt die Liste für alle lahm.
- **Reifegrad nach einem Reset.** `levelProgress()` haengt an `S.lifetime`, und
  die bleibt beim Sporenflug stehen, waehrend die Produktion auf null faellt.
  Der Balken steht dann real still — gemessen 1 % nach einer halben Stunde. Wer
  daran etwas aendert, aendert Balance; die Anzeige loest es ueber `E.aufbau()`.
- **Zeit in der Bildschleife.** Der Schritt ist auf 0,25 s gedeckelt. Wer sich
  darauf verlässt, verliert jede Pause, in der die Seite schlief — auf dem iPad
  ist das der Normalfall. Immer gegen `Date.now()` prüfen, nicht gegen den
  Bildzähler.

## Testen

Die Spiellogik ist vollständig aus der Browser-Konsole ansteuerbar (`S`, `E`, `UI`,
`Save`, `LB` sind global). Damit lassen sich Export/Import, Kaufmengen,
Meilensteine, goldene Sporen, Offline-Kappe, Bestenliste und beide
Prestige-Schichten prüfen, ohne stundenlang zu spielen.

Für die Pausen-Erkennung lässt sich `Date.now` kurzzeitig überschreiben und
`visibilitychange` von Hand auslösen — damit ist der iPad-Fall ohne iPad prüfbar.

Immer gegenprüfen: 375×812 (Handy) und 768×1024 (iPad).

## Nach jeder Änderung

1. Simulation, falls Zahlen betroffen sind
2. `?v=` in `index.html` hochzählen
3. [docs/AENDERUNGEN.md](docs/AENDERUNGEN.md) ergänzen
4. betroffene Dokumente mitziehen

## Stand

Version 2.4.1 — die Aufbauphase nach einem Sporenflug ist sichtbar: Solange die
Produktion unter dem Stand vor dem Flug liegt, zeigt ein zweiter Balken den
Wiederaufbau statt eines Reifegrads, der sich real nicht ruehrt. Reine Anzeige,
keine Zahl angefasst.

Davor: Version 2.4 — drei Fehler behoben, die auf dem iPad zusammenkamen: der Skillbaum
war nach jedem Neuladen leer (`merge()` übersprang die freien Tabellen), das
Offline-Wachstum griff nie (Safari legt die Seite schlafen, statt sie zu entladen),
und die Bestenliste war unlesbar (`1e+27` wurde beim Schreiben zu `1e 27`). Dazu
neu: Übersicht bei der Rückkehr, Restzeit bis zum nächsten Reifegrad, Bestenliste
mit Statuszeile und eigener Position.

Davor: kein Tutorial mehr (Erklärungen erscheinen beim Freischalten), drei
Spielstand-Plätze mit Umbenennen, Bestenliste oben in der Statistik, Erfolge in
fünf farbigen Gruppen. Davor: ohne Prüfungen, Kern zeigt den Reifegrad, Optionen
nur hinter dem Menü, Musik startet aus. Davor: Baum mit Nebel, jeder Ast mit
eigener Wege- und Knotenform, 21 Querverbindungen, live erzeugte Musik.

Tasten: `S` löst die Symbiose aus. Eine Taste fürs Speichern gibt es bewusst nicht —
das läuft automatisch.
