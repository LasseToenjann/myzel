# 🔧 Technik-Dokumentation

Alles, was man wissen muss, um am Code weiterzuarbeiten. Die Spielregeln stehen in
der [Spielanleitung](SPIELANLEITUNG.md), die inhaltliche Begründung im
[Konzept](../KONZEPT.md).

- [Grundsätze](#grundsätze)
- [Mobile und iPad zuerst](#mobile-und-ipad-zuerst)
- [Dateien und Zuständigkeiten](#dateien-und-zuständigkeiten)
- [Spielzustand](#spielzustand-s)
- [Der Rechenweg](#der-rechenweg-enginejs)
- [Skillbaum](#skillbaum)
- [Balance und ihre Fallen](#balance-und-ihre-fallen)
- [Oberfläche und das Flackern](#oberfläche-und-das-flackern)
- [Bestenliste](#bestenliste)
- [Suchmaschinen](#suchmaschinen)
- [Testen](#testen)
- [Erweitern](#erweitern)
- [Bekannte Grenzen](#bekannte-grenzen)

---

## Grundsätze

- **Kein Build.** Klassische `<script>`-Einbindung, globale Module (`U`, `D`, `S`,
  `E`, `FX`, `UI`, `LB`, `Game`). `index.html` öffnen genügt — auch ohne Server.
- **Inhalte von Logik trennen.** Neue Strukturen, Knoten, Mutationen, Biome und
  Erfolge kommen ausschließlich in `js/data.js`. Wer dort etwas ergänzt, muss
  `engine.js` nicht anfassen.
- **Nie Fortschritt wegnehmen.** Reifegrad und Skillbaum sinken unter keinen
  Umständen. `S.level` ist der höchste je erreichte Wert, nicht der aktuelle.
- **Alles ist erklärt.** Jeder Knoten, jede Mutation und jedes Biom trägt einen
  Beschreibungstext, der den Effekt der *nächsten* Stufe in Klartext nennt.

## Mobile und iPad zuerst

Gespielt wird auf kleinen Bildschirmen; der Desktop ist die Zugabe.

- Bauen bei **390 px** Breite, gegenprüfen bei **320 px**. Kein horizontaler Überlauf.
- Tippflächen auf Touchgeräten mindestens **44 px** hoch — geregelt über
  `@media(pointer:coarse)` in `css/style.css`.
- Der Skillbaum ist auf Touch vollständig bedienbar: ziehen, zwei Finger zum
  Zoomen, Doppeltipp setzt die Ansicht zurück. Die Legende blendet sich unter
  700 px aus, weil sie sonst ein Drittel des Baums verdeckt.
- Prüfen mit den Voreinstellungen **375×812** (Handy) und **768×1024** (iPad).

## Dateien und Zuständigkeiten

| Datei | Zuständig für |
|---|---|
| `js/util.js` | Zahlformatierung (deutsche lange Leiter: Mio, Mrd, Bio, Brd …), DOM-Helfer, geometrische Reihen für Massenkäufe, Speicher-Kodierung |
| `js/data.js` | **alle Inhalte**: 8 Strukturen, 72 Skillknoten, 18 Mutationen, 8 Biome, 4 Prüfungen, 59 Erfolge, Ticker-Texte, goldene Sporen |
| `js/state.js` | Spielstand anlegen, speichern, laden, migrieren |
| `js/engine.js` | der gesamte Rechenweg, Käufe, Prestige, Erfolge, Offline |
| `js/fx.js` | wachsendes Hintergrund-Myzel, Partikel, Toasts, Klänge, goldene Sporen |
| `js/ui.js` | alle Reiter, der Skillbaum als SVG, die Kopfzeile |
| `js/leaderboard.js` | globale Bestenliste |
| `js/main.js` | Startbildschirm, Spielschleife, Modale, Tasten |

## Spielzustand (`S`)

Ein einziges Objekt, definiert in `Save.fresh()`. Wichtige Felder:

| Feld | Bedeutung |
|---|---|
| `biomass` | aktuelle Biomasse |
| `lifetime` | **jemals** erzeugte Biomasse — bestimmt den Reifegrad, sinkt nie |
| `runTotal` | seit dem letzten Sporenflug erzeugt — bestimmt den Sporen-Gewinn |
| `level` | höchster je erreichter Reifegrad |
| `structs` / `bought` | besessene bzw. gekaufte Menge je Struktur; `bought` bestimmt den Preis |
| `nodes` / `muts` | Stufe je Skillknoten bzw. Mutation |
| `sporen` / `sporeLife` | verfügbare bzw. je gesammelte Sporen |
| `sp` / `spLife` | dasselbe für Symbiose-Punkte |
| `pid` | dauerhafte Kennung für die Bestenliste |

Beim Laden füllt `Save.merge()` fehlende Felder aus `fresh()` auf. **Neue Felder
gehören immer nur in `fresh()`** — dann laufen alte Spielstände ohne Migration weiter.

## Der Rechenweg (`engine.js`)

`E.recalc()` baut bei jedem Tick alle Modifikatoren neu auf. Die Reihenfolge ist
bewusst gewählt:

1. Skillbaum · 2. Mutationen · 3. Biome · 4. Erfolge (×1,02 je Stück) ·
5. Sporen (Lebenszeit) · 6. Symbiose-Punkte (Lebenszeit) · 7. Prüfungsbelohnungen ·
8. laufende goldene Sporen · 9. Ruhewachstum · 10. Einschränkung einer laufenden Prüfung

Danach greift der **weiche Deckel**, dann wird die Produktion je Struktur berechnet:

```
prod[i] = Grundwert × Anzahl × Meilenstein × structMult[i] × global
```

Der Reifegrad ergibt sich aus `lifetime × xpMult`: **0,40 Zehnerpotenzen je Stufe**
(`LVL_STEP`). Wachstumspunkte je Stufe: `1 + floor(Stufe / 10)`, dazu alle 25 Stufen
drei extra.

## Skillbaum

72 Knoten in sechs Ästen, radial angeordnet: `D.nodePos()` rechnet Ring und Platz
in Koordinaten um (Radius `105 + Ring × 82`, Winkel je Ast). Gezeichnet wird als
SVG, verschoben und gezoomt über eine `transform` auf der Gruppe.

Die Kosten vergibt `data.js` **systematisch**, nicht von Hand: Der Ring bestimmt
den Grundpreis (`RING_BASE`), das Wachstum ergibt sich aus der Stufenzahl
(`1 + 1,2 / max`) — die letzte Stufe kostet dadurch immer rund das 3,2-fache der
ersten. Der ganze Baum kostet etwa **2 250 Punkte**.

Äußere Ringe tragen `sym: n` und öffnen sich erst mit *n* erschlossenen Biomen.

## Balance und ihre Fallen

Zwei Rückkopplungen können ein Incremental binnen Stunden ins Unendliche treiben.
Beide sind hier passiert und beide sind abgesichert — **wer an diesen Zahlen dreht,
muss die Simulation laufen lassen**:

**1. Meilenstein gegen Kostenwachstum.** Jede 25. Struktur verdoppelt ihre
Produktion, das entspricht einem Wachstum von 2^(1/25) = **1,0281** pro Stück.
Liegt das Kostenwachstum darunter, trägt sich jede weitere Struktur selbst und die
Produktion läuft weg. Die Kostensenkungen im Ast *Effizienz* summierten sich auf
0,165 und drückten die Hyphe auf 0,965 — deshalb gibt es die Untergrenze
`GROWTH_FLOOR = 1,10` in `engine.js`.

**2. Produktion → Sporen → Produktion.** Der Sporen-Gewinn wächst mit
`runTotal^0,35`, der Bonus daraus mit `sporeLife^0,55`. Beides zusammen mit dem
Multiplikator-Anteil der Produktion muss unter 1 bleiben, sonst divergiert die
Schleife. Drei Bremsen:

- kleiner Sporen-Exponent (`SPORE_EXP = 0,35`), Boni darauf nur in
  Tausendstel-Schritten
- gedämpfte Sporen-Kurve: Der Exponent sinkt mit der Größenordnung (`sporeMult()`)
- weicher Deckel: ab `SOFTCAP = 1e11` wächst der Gesamtmultiplikator nur noch mit
  Potenz 0,7. In der Statistik erscheint dann „(gedämpft)"

**3. Startkapital ist kein Ertrag.** Die Biomasse, mit der man nach einem
Sporenflug startet, darf **nicht** in `lifetime` oder `runTotal` einfließen —
sonst erzeugt jeder Flug aus dem Nichts Sporen für den nächsten.

Zielwerte für einen pausenlos und optimal spielenden Bot: erster Sporenflug nach
etwa 5 Stunden, erste Symbiose nach 17, „Der Kern" nach 21, Reifegrad 160 nach 31.

## Oberfläche und das Flackern

Die Oberfläche wird zehnmal pro Sekunde aufgefrischt. Wer dabei `innerHTML` eines
Bereichs neu setzt, **erzeugt Knöpfe und Eingabefelder jedes Mal neu** — sie lassen
sich dann weder anklicken noch beschriften und flackern sichtbar. Genau das ist
passiert und war die Ursache dafür, dass sich der automatische Sporenflug nicht
einstellen ließ.

Regel: Bereiche **einmal** in `buildX()` aufbauen, danach in `refreshX()` nur noch
Werte setzen — und zwar über die Helfer `setText()`, `setHTML()` und `setW()`, die
nur schreiben, wenn sich der Inhalt tatsächlich geändert hat. Eingabefelder werden
nie überschrieben, solange sie den Fokus haben.

## Bestenliste

`js/leaderboard.js`, global über [textdb.online](https://textdb.online) — derselbe
Dienst wie beim Wahlwächter.

- Lesen: `GET https://textdb.online/<key>`
- Schreiben: `GET https://textdb.online/update/?key=<key>&value=<json>`
- Schlüssel: `myzel_rangliste_q4v8n2`

Es gibt kein Konto und keine Rechte: Wer den Schlüssel kennt, kann schreiben.
Deshalb steht dort ausschließlich, was öffentlich sein darf — Anzeigename,
Reifegrad, Biomasse, Symbiose-Punkte, Sporenflüge. Die Einträge nutzen kurze
Feldnamen (`i n l b s p d`), weil alles zusammen in einem Textfeld liegt.

Jeder Spielstand hat eine dauerhafte Kennung (`S.pid`), damit erneutes Senden den
eigenen Eintrag *aktualisiert* statt einen zweiten anzulegen. Beim Schreiben laufen
bis zu drei Versuche, weil gleichzeitige Zugriffe sich sonst überschreiben können.
Ist der Dienst nicht erreichbar, zeigt das Spiel den zuletzt geladenen Stand aus
`localStorage` — es wartet nie auf eine Antwort.

**Den Schlüssel niemals leeren.** Dort stehen die Ergebnisse aller Mitspielenden.

## Suchmaschinen

- `google-site-verification` im `<head>` — bleibt dort stehen, sonst gilt die Seite
  in der Search Console als unbestätigt.
- **Favicon als echte Datei** unter `assets/favicon.svg`. Ein `data:`-URI zeigt der
  Browser zwar im Tab an, Google kann ihn aber nicht abrufen — in der Suche und in
  der Search Console bleibt das Bild dann leer. Genau deshalb wurde umgestellt.
- `sitemap.xml` mit einer einzigen URL: Alle Bildschirme sind Abschnitte in
  `index.html`, es gibt keine Routen.
- `robots.txt` liegt bei, ist im Projektpfad `/myzel/` aber **folgenlos** —
  Suchmaschinen lesen sie nur im Wurzelverzeichnis einer Domain. `css/` und `js/`
  sind bewusst nicht gesperrt, weil Google die Seite zum Indexieren rendert.
- Die Datei-Verweise tragen einen Versionsparameter (`?v=1.0.x`). Er muss bei jeder
  Änderung an CSS oder JS hochgezählt werden, sonst liefern Browser die alte Fassung.

## Testen

**Simulation.** Ein Bot spielt das Spiel kopflos in Node und meldet den Verlauf.
Er lädt `util.js`, `data.js`, `state.js` und `engine.js` in einen `vm`-Kontext;
`localStorage` und `document` werden ersetzt. Zu beachten: Top-Level-`const` landen
im lexikalischen Bereich, nicht auf dem Sandbox-Objekt — die Module holt man mit
`vm.runInContext('({U, D, E, Save})', ctx)` heraus.

Prüfen: fällt der Reifegrad in gleichmäßigen Schritten, oder gibt es einen Sprung
über 50 Stufen in wenigen Minuten? Ein solcher Sprung ist immer ein Balance-Fehler.

**Im Browser.** Die Spiellogik lässt sich vollständig aus der Konsole ansteuern —
`S`, `E`, `UI`, `Save` sind global. Damit prüft man Export/Import, Kaufmengen,
Meilensteine, Prüfungen, goldene Sporen, Offline-Kappe und beide Prestige-Schichten
ohne stundenlanges Spielen.

## Erweitern

- **Neue Struktur**: Eintrag in `D.STRUCTS`. Kostenwachstum über 1,10 halten.
- **Neuer Skillknoten**: Eintrag in `D.NODES` mit Ast, Ring, Platz, Beschreibung
  und Wirkung. Kosten vergibt die Automatik. Ohne `req` hängt er am vorherigen
  Knoten desselben Astes.
- **Neue Mutation oder neues Biom**: Einträge in `D.MUTATIONS` bzw. `D.BIOMES`.
- **Neuer Erfolg**: `A(id, name, beschreibung, bedingung)` in `data.js`.

Nach jeder Änderung an Zahlen: Simulation laufen lassen und
[AENDERUNGEN.md](AENDERUNGEN.md) ergänzen.

## Bekannte Grenzen

- Zahlen sind normale Gleitkommazahlen. Oberhalb von etwa 1e308 wäre Schluss —
  die Inhalte enden lange davor, aber eine `BigNumber`-Schicht gibt es nicht.
- Der Spielstand liegt im `localStorage` **dieses** Browsers. Kein Konto, keine
  Synchronisierung zwischen Geräten; dafür gibt es den Export als Text.
- Die Bestenliste ist nicht fälschungssicher. Wer den Schlüssel kennt oder die
  Konsole öffnet, kann beliebige Werte eintragen — für ein Spiel dieser Art
  bewusst in Kauf genommen.
- Das Hintergrund-Myzel wird bei etwa 5 200 Segmenten gedeckelt, damit es auf
  älteren Geräten flüssig bleibt.
