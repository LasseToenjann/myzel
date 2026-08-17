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
- [Spielstand-Plätze](#spielstand-plätze)
- [Musik](#musik)
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
| `js/data.js` | **alle Inhalte**: 8 Strukturen, 72 Skillknoten, 17 Mutationen, 8 Biome, 59 Erfolge, Ticker-Texte, goldene Sporen |
| `js/state.js` | Spielstand anlegen, speichern, laden, migrieren |
| `js/engine.js` | der gesamte Rechenweg, Käufe, Prestige, Erfolge, Offline |
| `js/fx.js` | wachsendes Hintergrund-Myzel, Partikel, Toasts, Klänge, goldene Sporen |
| `js/ui.js` | alle Reiter, der Skillbaum als SVG, die Kopfzeile |
| `js/music.js` | Klangteppich: Akkordfolge, Tropfentöne, Filter, Echo |
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
5. Sporen (Lebenszeit) · 6. Symbiose-Punkte (Lebenszeit) ·
7. laufende goldene Sporen · 8. Ruhewachstum

Danach greift der **weiche Deckel**, dann wird die Produktion je Struktur berechnet:

```
prod[i] = Grundwert × Anzahl × Meilenstein × structMult[i] × global
```

Der Reifegrad ergibt sich aus `lifetime × xpMult`: **0,40 Zehnerpotenzen je Stufe**
(`LVL_STEP`). Wachstumspunkte je Stufe: `1 + floor(Stufe / 10)`, dazu alle 25 Stufen
drei extra.

## Skillbaum

72 Knoten in sechs Ästen. **Radiales Baumlayout**: Jeder Ast belegt einen festen
Kreisausschnitt von 48°, innerhalb dessen Geschwister den Platz im Verhältnis zu
ihrer Zweiggröße aufteilen (`blaetter()`). Dadurch überlappt nichts — der kleinste
Knotenabstand liegt bei 74 px bei 42–50 px breiten Knoten — und eine Gabelung bleibt
bis nach außen sichtbar.

Die frühere Fassung rechnete den Winkel nur aus Ast und Platz, und die Streuung
*sank* nach außen. Ergebnis waren sechs gerade Speichen; jede Gabelung lief wieder
zur Astachse zusammen.

Die Struktur steht als lesbare Tabelle `PARENT` in `data.js` — jeder Ast gabelt sich
einmal. Ein Sicherheitsnetz meldet Kreisbezüge. `LAYOUT` überschreibt Ring und Platz
der Automatik-Knoten, damit die acht Autokäufer als zwei parallele Linien stehen
statt als eine lange Kette.

**Eigene Formensprache je Ast.** Farbe allein reicht nicht, um Kategorien
auseinanderzuhalten — vorher sahen alle sechs Äste identisch aus. Jeder Ast hat
deshalb eine eigene **Wegform** (`wegForm()`) und eine eigene **Knotenform**
(`kopfForm()`):

| Ast | Weg | Knoten | Warum |
|---|---|---|---|
| Wachstum | geschwungene Ader | Kreis | organisch, wie eine Hyphe |
| Symbiose | zwei Stränge | Raute | Partnerschaft, zwei Seiten |
| Tiefe | punktierter Schacht | Dreieck | senkrecht nach unten |
| Automatik | zwei Schienen mit Schwellen | Riegel | technisch, getaktet |
| Zersetzung | gestrichelt, langsam fließend | Siebeneck | zerfallendes Material |
| Effizienz | rechte Winkel | Sechseck | Ordnung, nichts Rundes |

**Reihenfolge im Kreis** ist nicht beliebig: Verwandtes liegt nebeneinander. Oben
Wachstum, daneben Symbiose (beide erhöhen die Ausbeute), dann Tiefe als Übergang
ins Meta-Spiel, unten Automatik und Zersetzung (beide betreffen Zeit, in der man
nicht zusieht), links Effizienz.

**Kategorien sichtbar machen**: Jeder Ast bekommt ein eingefärbtes Kreissegment als
Hintergrund (radialer Verlauf, nach außen auslaufend). Die Beschriftung nennt Name,
**Zweck** in Klartext und die Zahl der gekauften Stufen. Eine Legende gibt es
bewusst nicht — die Information gehört an den Ast selbst, nicht in eine Tabelle
daneben.

**Nebel.** `sichtbar(id)` entscheidet, was gezeichnet wird: gekaufte Knoten, die
ersten Knoten eines Astes und direkte Kinder gekaufter Knoten. Alles andere bekommt
`display:none`. Dadurch baut sich der Baum sichtbar auf. `fitTree()` rechnet den
Rahmen aus genau diesen Knoten und passt die Ansicht ein — der Baum zoomt mit jedem
Fortschritt automatisch etwas heraus. Einen Zurücksetzen-Knopf gibt es bewusst nicht.

**Wachsende Segmente**: Das Segment eines Astes reicht nur so weit nach außen, wie
dieser Ast ausgebaut ist (`D.branchInfo()` liefert Stufen, Maximum und den Radius des
äußersten gekauften Knotens). Umgesetzt als `transform: scale()` mit Ursprung im Kern
— eine CSS-Übergang animiert das Wachstum, weil sich ein `d`-Attribut nicht animieren
lässt. Unter der Ast-Beschriftung steht die Zahl der gekauften Stufen.

**Vernetzung**: 21 Querverbindungen (`WEAVES`) zwischen benachbarten Ästen. Sie sind
auch ungekauft schwach zu sehen — das Netz ist da, es leuchtet nur noch nicht — und
werden hell, sobald beide Enden gekauft sind.

Die Kosten vergibt `data.js` **systematisch**, nicht von Hand: Der Ring bestimmt
den Grundpreis (`RING_BASE`), das Wachstum ergibt sich aus der Stufenzahl
(`1 + 1,2 / max`) — die letzte Stufe kostet dadurch immer rund das 3,2-fache der
ersten. Wichtig: Die Kostenvergabe läuft **nach** dem Umsortieren, sonst passt sie
nicht zum tatsächlichen Ring. Der ganze Baum kostet etwa **2 550 Punkte**.

**Freischaltung.** Neben `sym: n` (Biome) gibt es die Tabelle `GATE`: `struct: i`
verlangt eine freigeschaltete Struktur, `spore: true` mindestens einen Sporenflug.
Ohne das ließen sich Sporen-Boni kaufen, lange bevor es Sporen gibt — Punkte, die
ins Leere gehen. `E.gateReason()` liefert den Klartext, der im Knotenfenster steht.

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

## Spielstand-Plätze

Drei Plätze unter `myzel_platz_1` bis `myzel_platz_3`, dazu `myzel_letzter_platz`.
Der alte Einzelspielstand (`myzel_save_v1`) wandert beim ersten Start automatisch auf
Platz 1 — `Save.migriere()` erledigt das, niemand verliert Fortschritt.

`Save.slots()` liefert die Kurzinfos für den Startbildschirm, ohne den ganzen
Spielstand zu laden. Jeder Platz hat eine eigene Bestenlisten-Kennung (`S.pid`),
weshalb zwei Plätze auch zwei Einträge in der Rangliste erzeugen.

Der Name ist **Pflicht**: Er wird beim Anlegen abgefragt, weil sich das Spiel von
selbst in die Bestenliste einträgt und ein leerer Name dort nichts taugt.

### Die Falle in `merge()`

`Save.merge()` füllt beim Laden fehlende Felder aus der frischen Vorlage auf und
läuft dazu über deren Felder. **Freie Tabellen haben dort keine Felder.** `nodes`
und `muts` stehen in `fresh()` als `{}` — die Schleife lief ins Leere und übernahm
nichts, der Skillbaum war nach jedem Neuladen weg. Innerhalb einer Sitzung fiel es
nicht auf, weil `S` im Speicher blieb.

Regel: Eine Tabelle ohne feste Felder wird **ganz** übernommen, nicht Feld für
Feld. `saubereTabelle()` wirft danach heraus, was nicht in `D.NODE_BY_ID` bzw.
`D.MUT_BY_ID` steht oder keine positive Zahl ist.

### Zeitstempel

`lastSave` ist der Zeitpunkt des letzten Schreibens, `lastSeen` der des letzten
Takts. Für die Abwesenheit zählt `lastSeen` — es wird bei jedem Bild fortgeschrieben
und ist damit auch dann aktuell, wenn das Speichern nicht mehr zum Zug kam.

## Musik

Live erzeugt statt aus einer Datei — eine Aufnahme wären mehrere Megabyte, die
zudem hörbar in Schleife liefen. Aufbau in `js/music.js`:

- drei Dauerstimmen (je zwei leicht verstimmte Schwingungen, das ergibt eine
  Schwebung) durch ein Tiefpassfilter bei 1500 Hz
- ein langsamer Oszillator (0,07 Hz) bewegt die Filterfrequenz, damit der
  Klang nicht steht
- eine dur-gefärbte Akkordfolge aus sechs Stufen wechselt alle 7,5–12 Sekunden weich
- darüber einzelne Tropfentöne aus der C-Dur-Pentatonik alle 1,8–4,8 Sekunden
- ein Echo (0,33 s, Rückführung 0,34) ersetzt einen Hall

Kein Halbtonschritt im Tonvorrat, dadurch klingt nichts spannungsgeladen. Die
erste Fassung lag eine Oktave tiefer und in Moll — das wirkte düster und schwer
für ein Spiel, das leicht sein soll. Die
Lautstärke wird quadriert, weil das dem Höreindruck besser entspricht.

Gestartet wird erst beim Eintritt ins Spiel — vorher verbieten Browser das Abspielen
ohne Zutun der Nutzenden.

## Reifegrad und die Aufbauphase

Ein Reifegrad verlangt die **2,5-fache Biomasse des gesamten bisherigen Spiels**
(`LVL_STEP = 0.40` Zehnerpotenzen je Stufe). Gemessen über 24 Stufen ist die
Form im ununterbrochenen Spiel gutmütig: Der Balken erreicht 1 % nach 0,7 % der
Stufendauer und 50 % nach 44 % — vorn schneller als hinten, weil er logarithmisch
aufträgt. Die Stufen dauern mittleres Spiel hinweg allerdings 8 bis 16 Stunden;
1 % davon sind trotzdem Minuten.

### Reifewert statt Biomasse × Reifung

Gerechnet wird der Reifegrad aus `E.reifeWert()`:

```
S.lifetime * m.xpDauer + S.reifeBonus
```

`m.xpDauer` ist der Reifungs-Multiplikator **ohne** die zeitlich begrenzten
Buffs; `recalc()` sichert ihn direkt vor Schritt 8. Der Grund: Ein Buff, der
`m.xp` mit fünf multipliziert, wirkte sonst rückwirkend auf die gesamte je
erzeugte Biomasse und schenkte auf einen Schlag rund **1,75 Stufen** — dauerhaft,
weil der Reifegrad nie sinkt. Danach stand der Balken stundenlang bei null.

Was ein Buff zusätzlich bringt, sammelt `reifen(menge)` stattdessen laufend in
`S.reifeBonus`, und zwar nur aus dem, was während der Laufzeit wirklich
produziert wird. Aufgerufen wird es an allen fünf Stellen, an denen Biomasse
entsteht (Takt, Automatik-Klicks, Klick, goldene Sofort-Spore, Offline).

Spielstände mit bereits verschenkten Stufen füllt `recalc()` einmalig auf, damit
ihr Reifewert den Reifegrad deckt — sonst behielten sie den toten Balken.

Bleibende Multiplikatoren aus Skills und Mutationen wirken weiterhin rückwirkend;
das ist gewollt und ändert an der Stufendauer nichts (über 24 Stufen nachgemessen).

**Nach einem Sporenflug bricht die Form.** `softReset()` setzt die Produktion auf
null, `S.lifetime` bleibt aber stehen. Bis die Produktion wieder in der
Größenordnung der insgesamt erzeugten Biomasse liefert, kann sich der Balken
nicht rühren — gemessen bei Reifegrad 20: 0,10 % nach fünf Minuten, 1,05 % nach
einer halben Stunde, dann 50 % → 86 % in der letzten Stunde.

Deshalb merkt sich `softReset()` die Produktion beim Reset in `S.rateVorReset`,
und `E.aufbau()` liefert daraus den Stand des Wiederaufbaus:

```js
{ aktiv, anteil, balken, rate, ziel }
```

`anteil` ist das ehrliche Verhältnis, `balken` dessen Wurzel. Die Wurzel ist
reine Darstellung: Roh aufgetragen stünde der Balken zehn Minuten lang bei fast
null — also genau das Problem, das er lösen soll. Damit dabei nichts beschönigt
wird, steht daneben nie eine Prozentzahl, sondern immer die echten Werte
(`10,6 K von 99,2 K /s`).

Bezugswert ist bewusst **nicht** `stats.bestRate`: Dort steht auch ein Wert, der
nur während einer goldenen Spore erreicht wurde — danach sähe jedes Ablaufen
eines Buffs wie ein Wiederaufbau aus.

Bestehende Spielstände kennen `rateVorReset` nicht. `Save.pruefe()` trägt den
Wert beim Laden einmalig aus `stats.bestRate` nach, sofern schon einmal ein
Reset stattgefunden hat — sonst bliebe die Anzeige bis zum nächsten Sporenflug
stumm.

Im Aufbau übernimmt `nextGoal()` diese Phase als aktuelles Ziel — und zwar vor
den Prestige-Zielen, weil die ohne Produktion unerreichbar sind, und die
Restzeit-Schätzung wird ausgeblendet; sie ergab eine Minute nach dem Flug
763 Tage.

## Offline-Wachstum und schlafende Seiten

Zwei verschiedene Fälle, eine Stelle: `Game.rueckkehr(sekunden)`.

**Seite neu geladen.** `checkOffline()` nimmt die Zeit seit `S.lastSeen`.

**Seite hat geschlafen.** Das ist der Regelfall auf dem iPad — Safari entlädt die
Seite nicht, es hält sie an. `requestAnimationFrame` steht still, und weil die
Schleife jeden Schritt auf 0,25 s deckelt, verfiel die Pausenzeit früher
vollständig. `pruefePause()` vergleicht deshalb bei jedem Bild die **Wanduhr**
(`Date.now()`) mit dem letzten Bild:

| Lücke | Behandlung |
|---|---|
| bis 1,5 s | nichts, das deckt der normale Takt ab |
| bis 30 s | echte Zeit in Schritten von 0,25 s nachgerechnet |
| darüber | Offline-Wachstum mit Kappe und Ausbeute, dazu die Übersicht |

Ausgelöst wird zusätzlich über `visibilitychange` und `focus`, damit es nicht erst
beim nächsten Bild greift. 120 Takte am Stück kosten gemessen 0,7 ms — das fällt
in keinem Bild auf.

Grundwerte: Kappe `m.offlineH` = 4 Stunden, Ausbeute `m.offlineEff` = 45 %. Beides
steigt im Ast *Zersetzung* und im Biom *Moor*.

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

### Der Dienst dekodiert zweimal

**Teuer erkauft, deshalb hier festgehalten.** textdb.online dekodiert den Wert
beim Schreiben zweimal und macht im zweiten Durchgang aus jedem `+` ein
Leerzeichen. Nachgemessen mit einem Wegwerf-Schlüssel:

| gesendet | kommt an |
|---|---|
| `A+B` | `A B` |
| `%2B` | `+` |
| `e+27` | `e 27` |
| `&` `#` `/` `=` | unverändert |

`JSON.stringify` schreibt große Zahlen als `1e+27`. Daraus wurde `1e 27`, und das
gespeicherte JSON war unlesbar — die ganze Liste fiel aus, für alle, wegen eines
einzigen Eintrags.

Daher gilt: **Der Datensatz darf weder `+` noch `%` enthalten.**

- `zahl()` kürzt auf sechs geltende Stellen (hält die Adresse zugleich kurz)
- `baueWert()` ersetzt `e+` durch `e` — `1e27` ist weiterhin gültiges JSON
- `reinerName()` entfernt beide Zeichen aus Anzeigenamen
- `write()` prüft vor dem Senden auf verbotene Zeichen und auf die Adresslänge
  (Grenze 7500 Zeichen)
- `lesbar()` repariert beim Lesen den alten Schaden (`e 27` → `e+27`)

Jeder Spielstand hat eine dauerhafte Kennung (`S.pid`), damit erneutes Senden den
eigenen Eintrag *aktualisiert* statt einen zweiten anzulegen. Beim Schreiben laufen
bis zu drei Versuche, weil gleichzeitige Zugriffe sich sonst überschreiben können.

Gesendet wird **automatisch** (`LB.autoSubmit()`, angestoßen vom Speichertakt):
höchstens alle 90 Sekunden und nur, wenn sich Reifegrad, Größenordnung der Biomasse
oder Symbiose-Punkte geändert haben. Sonst entstünde bei jedem Tick ein Netzzugriff.
Zusätzlich beim Verlassen der Seite (`pagehide`) und auf Knopfdruck
(`autoSubmit(true)` umgeht beide Sperren). Abschaltbar über `S.opt.autoBoard`.

`LB.status()` sagt, wie es um den eigenen Eintrag steht (`neu`, `ok`, `fehler`,
`aus`) — die Statistik zeigt es an. Vorher blieb ein Fehlschlag unsichtbar, und es
sah so aus, als nehme die Liste einen einfach nicht auf.

Ein Eintrag trägt: Kennung, Name, Reifegrad, Biomasse, Symbiose-Punkte, Sporenflüge,
Zeitpunkt, Spielzeit, Erfolge, Skill-Stufen, Biome, beste Produktion, goldene Sporen
und Prüfungsstufen. In der Liste stehen die wichtigsten Spalten, der Rest erscheint
beim Antippen einer Zeile.
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
