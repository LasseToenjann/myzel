# Änderungsverlauf

## v2.7.0 – Die Symbiose wirft keine Lebenszeit-Zähler mehr weg

`doSym()` setzte `S.prestiges = 0`. Betroffen war weit mehr als die Anzeige:

| Was daran hing | Was passierte |
|---|---|
| Statistik, Bestenliste, Platzübersicht | *Sporenflüge* fiel auf 0 zurück |
| Erfolge *50 / 200 / 1000 Sporenflüge* | wurden praktisch unerreichbar |
| Erfolge *Sammle insgesamt X Sporen* | hingen an `sporeLife`, das beim Reset auf 0 muss |
| Skill **Waldgedächtnis** (+2 % je Stufe **je Sporenflug**) | ist mit `sym: 1` freigeschaltet, also **erst nach der ersten Symbiose** — genau dann stand der Zähler auf 0. Der Skill war in dem Moment, in dem man ihn erstmals kaufen kann, exakt wertlos. |

**Neu:**

- `S.prestiges` sinkt nie mehr.
- `S.sporenGesamt` zählt die Sporen über alle Symbiosen hinweg. Die Erfolge
  *Sammle insgesamt X Sporen* und die Statistik lesen jetzt diesen Zähler.
- `S.sporeLife` bleibt, was es war: der Bestand, der den Produktions-Bonus
  trägt und bei der Symbiose zurückgeht. Steht in der Statistik als eigene
  Zeile *davon seit der Symbiose*, sobald es eine gab.

Spielstände, die vor dieser Fassung schon eine Symbiose hinter sich haben,
lassen sich nicht heilen — die Zahlen standen nirgends mehr. Ab jetzt zählt es.

**Zur Balance.** Weil *Waldgedächtnis* nun den echten Zähler liest, wird es zu
einem ernsthaften Skill statt zu einer Falle. Gemessen an einem Spielstand kurz
nach der ersten Symbiose (voll ausgebaut, 10 Stufen, nach dem weichen Deckel):

| Sporenflüge | 10 | 50 | 100 | 200 | 500 | 1000 |
|---|---|---|---|---|---|---|
| wirksamer Faktor | ×2,2 | ×5,4 | ×8,4 | ×13,5 | ×25 | ×41 |

Zum Vergleich im selben Zustand: *Allverbindung* ×5,4, *Der Kern* ×5,0, das Biom
*Urwald* ×25. Der Skill liegt damit in derselben Größenordnung wie die anderen
Endspiel-Skills.

Zwei Bot-Läufe über 60 Stunden mit identischen Entscheidungen, einmal mit und
einmal ohne den Reset: erster Sporenflug 9,1 h in beiden, erste Symbiose 36,7 h
in beiden, *Der Kern* 49,2 h gegen 49,7 h, Reifegrad nach 60 h 139 gegen 138.
Die Meilensteine verschieben sich also nicht.

## Der doppelte automatische Sporenflug

Zwei Dinge schalteten denselben Automaten frei: der Skillbaum-Knoten
**Sporen-Automat** (72 WP, Ast Automatik, braucht ein Biom) und die Mutation
**Sporen-Instinkt** (2500 Sporen). Der Unterschied war da, aber unsichtbar — die
Mutation geht bei jeder Symbiose verloren, der Skill nicht.

Beide Texte sagen das jetzt. Und wer den Skill hat, kann die Mutation nicht mehr
aus Versehen nachkaufen: Ihre Karte trägt die Marke **PER SKILL** und ist
gesperrt. 2500 Sporen gespart.


## v2.6.1 – Die Scrollleiste im Modal

Modale Fenster waren die einzige scrollende Fläche im Spiel ohne eigene
Leistenfarbe. Windows zeichnete dort seine graue Standardleiste samt Pfeiltasten
mitten in den abgerundeten Rahmen. Sie sieht jetzt aus wie die in den Reitern:
9 px, grüner Daumen, keine Spur, keine Pfeile. Gemessen sind beide exakt 10 px
breit.


## v2.6.0 – Zwei echte Zahlen statt einer erfundenen Dauer, und drei Erklärungen

**Beim Reifegrad stand eine Restzeit.** Sie war eine Hochrechnung mit der
Produktion von genau jetzt — und damit im Wiederaufbau wertlos: Eine Minute nach
einem Sporenflug ergab sie gemessen *763 Tage*. Dort steht jetzt der genaue
Stand:

```
alt:  noch ~2 h 14 min
neu:  14.1 Mrd von 15.8 Mrd
```

Wie schnell sich die beiden Zahlen aneinander annähern, sieht man ohnehin.
In der Aufbauphase bleibt es unverändert bei `10,6 K von 99,2 K /s` in Gold.

**Drei Info-Fenster.** Nirgends stand, wann es Sporen gibt und wie Reifegrade
entstehen. Ein kleines **i** öffnet jetzt die Erklärung:

| Wo | Was drinsteht |
|---|---|
| Kopfzeile, neben *Reifegrad* | woraus er entsteht, die Leiter der Stufen (×2,51 je Stufe), was er einbringt, was ihn beschleunigt |
| Reiter *Sporen*, neben ✺ *Sporenflug* | ab wann er sich öffnet (1 Mrd **im Durchlauf**), die Formel samt Exponent 0,35, wozu Sporen taugen, welche Skills den Ertrag heben |
| Reiter *Symbiose*, neben ☭ *Symbiose* | die zwei Bedingungen, die Formel mit Exponent 0,25, was der Reset kostet, wofür die Punkte da sind |

Die Texte werden **bei jedem Öffnen neu gebaut** und nennen die eigenen Zahlen
des Spielers, nicht irgendein Beispiel — inklusive „eine Spore mehr wären es ab
443 Mrd". Genannt werden die echten Formeln: Wer weiß, dass der Sporen-Exponent
0,35 beträgt und dass die doppelte Sporenzahl das 7,2-fache an Biomasse
verlangt, versteht auch, warum der zehnte Sporenflug so viel länger dauert als
der erste.

Die i-Knöpfe sind 19 px groß und haben eine unsichtbare 44-px-Fläche darum —
sonst trifft man sie auf dem iPad nicht.


## v2.5.1 – Der eigene Eintrag blieb im Wiederaufbau stehen

Gesendet wurde nur, wenn sich Reifegrad, die Größenordnung der Biomasse oder
die Symbiose-Punkte änderten. Nach einem Sporenflug bewegt sich davon aber
stundenlang nichts — die Biomasse wächst im Verhältnis zur bereits erzeugten
Menge kaum noch. Nachgerechnet, wann der nächste Versand fällig gewesen wäre:

| Zustand | Produktion | nächster Versand |
|---|---|---|
| Reifegrad 22, volle Produktion | 1,47 Mio /s | 1,1 min |
| **Reifegrad 22, mitten im Aufbau** | **20 /s** | **54 Tage** |
| Reifegrad 30, volle Produktion | 500 Mio /s | 5,0 min |
| **Reifegrad 30, kurz nach dem Flug** | **300 /s** | **5816 Tage** |

Man spielte also weiter, und der eigene Eintrag stand still.

**Neu ist der Takt:**

- Der Fingerabdruck umfasst jetzt **alles, was im Eintrag steht** — auch
  Skill-Stufen, Erfolge, Sporen, Biome, goldene Sporen und die beste
  Produktion. Und er ist zehnmal feiner als vorher.
- Dazu ein **Herzschlag**: Spätestens alle **fünf Minuten** wird ohnehin
  gesendet, auch wenn sich nichts geändert hat.
- Der Schutzabstand von **90 Sekunden** zwischen zwei Sendungen bleibt.

Gemessen über 25 Minuten im Wiederaufbau: acht Sendungen, größter Abstand
exakt fünf Minuten. Vorher wäre es bei einer geblieben.

Die Statuszeile in der Statistik nennt jetzt auch, wann zuletzt gesendet wurde.

**Zur Einordnung — drei Takte gibt es:**

| Was | Wie oft |
|---|---|
| eigener Eintrag geht raus | bei Änderung, höchstens alle 90 s · mindestens alle 5 min · beim Verlassen der Seite |
| angezeigte Liste lädt nach | jede Minute, solange die Statistik offen ist |
| Knopf *Jetzt aktualisieren* | sofort, umgeht beide Sperren |


## v2.5 – Der Reifeschub verschenkt keine Reifegrade mehr

Die goldene Spore **Reifeschub** multipliziert die Reifung 120 Sekunden lang mit
fünf. Der Reifegrad wurde aber aus `Biomasse × Reifung` gerechnet — der
Multiplikator wirkte damit **rückwirkend auf die gesamte je erzeugte Biomasse**.
Gemessen bei Reifegrad 22:

| | Reifegrad | Balken |
|---|---|---|
| vor dem Schub | 22 | 36,5 % |
| während des Schubs | **24** | 11,3 % |
| nach dem Schub | **24** | **0,0 %** |

Zwei Stufen aus dem Nichts, dauerhaft — und danach stand der Balken bei null,
bis die Biomasse nachgezogen war. Bei einem Spielstand mit drei so verschenkten
Stufen wären das über **einen Tag** ohne jede sichtbare Bewegung gewesen.

**Neu:** Der dauerhafte Reifegrad rechnet nur noch mit dem Multiplikator aus
Skills und Mutationen. Was ein zeitlich begrenzter Buff zusätzlich bringt, wird
während seiner Laufzeit *erarbeitet* — proportional zu dem, was in diesen zwei
Minuten wirklich produziert wird — und in `S.reifeBonus` gesammelt.

Damit springt nichts mehr aus dem Nichts, der Balken läuft während des Schubs
sichtbar schneller und danach normal weiter. Gemessen bei voller Produktion:
120 Sekunden Reifeschub bringen den Balken von 36,5 % auf 44,0 %, ohne Schub auf
38,1 %.

**Nichts wird weggenommen.** Der Reifegrad sinkt nicht, und Spielstände, die
schon Stufen aus alten Reifeschüben haben, bekommen den fehlenden Reifewert
einmalig gutgeschrieben — sonst hätten sie den toten Balken behalten.

Die Skills 🧺 *Kompost*, 📖 *Reifebeschleunigung* und die Mutation wirken
unverändert weiter, auch weiterhin rückwirkend. Nachgerechnet über 24 Stufen:
Die Dauer jeder einzelnen Stufe ist **exakt dieselbe** wie vorher.


## v2.4.2 – Die Aufbau-Anzeige greift auch für bestehende Spielstände

Der Bezugswert für den Wiederaufbau (`S.rateVorReset`) wurde nur beim
Sporenflug gesetzt. Wer zuletzt **vor** v2.4.1 geflogen war, hatte dort eine
Null — und sah weiter die alte Restzeit-Anzeige, obwohl er mitten im
Wiederaufbau steckte. Beim Laden wird der Wert jetzt einmalig aus der besten
bisherigen Produktion nachgetragen, sofern der Spielstand überhaupt schon
einmal geflogen ist.

Steht dort ein Wert, der nur mit einer goldenen Spore erreicht wurde, ist er
etwas zu hoch; spätestens der nächste Sporenflug setzt ihn wieder gerade.

Außerdem: Der Wiederaufbau steht im Feld **Nächstes Ziel** jetzt **vor** den
Prestige-Zielen. Solange die Produktion unten ist, sind Sporenflug und
Symbiose ohnehin unerreichbar — der Wiederaufbau ist das Einzige, woran man
gerade arbeitet.


## v2.4.1 – Der Reifegrad hängt nicht fest, er wartet auf die Produktion

Nach einem Sporenflug schien der Reifegrad-Balken minutenlang stillzustehen und
machte dann die zweite Hälfte in der letzten Stunde. Gemessen bei Reifegrad 20:

| Zeit nach dem Sporenflug | Reifegrad-Balken | Produktion |
|---|---|---|
| 5 Minuten | 0,10 % | 625 /s |
| 30 Minuten | 1,05 % | 10,6 K/s |
| 1 Stunde | 6,9 % | 45,6 K/s |
| 2 Stunden | 27 % | 76,4 K/s |
| 3 Stunden | 50 % | 90,7 K/s |
| 4 Stunden | 86 % | 313 K/s |

Eine halbe Stunde spielen für ein Prozent. Der Balken lügt dabei nicht: Ein
Reifegrad verlangt die 2,5-fache Biomasse des **gesamten bisherigen Spiels**,
und der Sporenflug setzt zwar die Produktion auf null, nicht aber die insgesamt
erzeugte Biomasse. Solange die Produktion wieder hochläuft, trägt sie zu einer
Zahl, die schon bei einer Milliarde steht, praktisch nichts bei.

Es passiert in dieser Zeit aber sehr wohl etwas — nur eben etwas anderes. Genau
das zeigt der Balken jetzt:

- Solange die Produktion unter dem Stand **vor dem Flug** liegt, füllt sich ein
  zweiter, goldener Balken hinter dem Reifegrad-Balken: der Wiederaufbau.
- Darunter stehen die echten Werte — `10,6 K von 99,2 K /s`. Keine erfundene
  Prozentzahl: Der Balken ist für die Lesbarkeit gestreckt (Wurzel, weil die
  Produktion exponentiell zurückklettert), die Zahlen daneben sind exakt.
- Auch das Feld **Nächstes Ziel** nennt in dieser Phase den Wiederaufbau statt
  eines Reifegrads, der noch stundenlang nicht kommt.
- Die Restzeit-Schätzung verschwindet währenddessen. Sie war dort unbrauchbar —
  eine Minute nach dem Flug stand dort „noch ~763 Tage".

Ab dem Moment, in dem der alte Stand wieder erreicht ist, verschwindet der
goldene Balken und der Reifegrad übernimmt. Dieselbe Anzeige greift nach einer
Symbiose.

**An den Zahlen des Spiels ändert sich nichts.** Der Reifegrad braucht genauso
lang wie vorher — man sieht jetzt nur, woran man in der Zwischenzeit arbeitet.
Kürzer wird die Aufbauphase über die Skills 🎒 *Nährstoffdepot* und 🪨 *Totholz*
(Startkapital nach dem Flug) sowie 🧠 *Erinnerung* (behält Strukturen).


## v2.4 – Drei Fehler, die auf dem iPad zusammenkamen

**Der Skillbaum war nach jedem Neuladen leer**

Der schwerste der drei. `Save.merge()` füllt beim Laden fehlende Felder auf und
läuft dazu über die Felder der frischen Vorlage. `nodes` und `muts` sind dort
aber leere Tabellen `{}` — und eine leere Tabelle hat keine Felder, über die man
laufen könnte. Also wurde dort **nichts** übernommen: Skillbaum und Mutationen
fielen bei jedem Laden still unter den Tisch. In einer laufenden Sitzung fiel es
nie auf, weil der Spielstand im Speicher blieb; erst das Neuladen der Seite legte
es offen. Freie Tabellen werden jetzt vollständig übernommen, und beim Laden
fliegen unbekannte oder unsinnige Einträge heraus.

**Offline-Wachstum griff auf dem iPad überhaupt nicht**

Angerechnet wurde die Abwesenheit nur beim *Neuladen* der Seite. Safari auf dem
iPad entlädt die Seite aber nicht — es legt sie schlafen. Die Bildschleife stand
still, und weil sie jeden Schritt auf 0,25 Sekunden deckelt, verfiel die gesamte
Pausenzeit ersatzlos. Jetzt vergleicht die Schleife bei jedem Bild die Wanduhr:

- **bis 30 Sekunden** — echte Zeit, ganz normal nachgerechnet. Kurze
  Unterbrechungen kosten nichts mehr.
- **darüber** — Offline-Wachstum mit Kappe und Ausbeute, dazu eine Übersicht.

Das erklärt auch den **scheinbar feststeckenden Reifegrad**: Er stand nicht fest,
das Spiel stand still, solange die Seite schlief.

**Die Rückkehr wird gezeigt**

Ein eigenes Fenster mit hochzählender Zahl, der abwesenden Zeit und dem, was
dazugekommen ist: Reifegrade, neu freigeschaltete Strukturen, Erfolge und
bereitstehende Sporen. War die Kappe im Weg, sagt es das und verweist auf den
Ast *Zersetzung*.

**Die Bestenliste nahm niemanden mehr auf**

textdb.online dekodiert den übergebenen Wert **zweimal** und macht dabei im
zweiten Durchgang aus jedem `+` ein Leerzeichen. Aus `1e+27` wurde `1e 27` — und
damit war das gespeicherte JSON kaputt. Jedes Lesen scheiterte; da Senden mit
Lesen beginnt, kam auch kein neuer Eintrag mehr hinein. **Ein einziger
verstümmelter Eintrag legte die Liste für alle lahm.**

- Der Datensatz enthält jetzt weder `+` noch `%`. Große Zahlen werden auf sechs
  geltende Stellen gekürzt und ohne Vorzeichen im Exponenten geschrieben
  (`1e27`) — das ist weiterhin gültiges JSON und übersteht den Weg unbeschadet.
- Namen werden von beiden Zeichen befreit.
- Beim Lesen wird alter Schaden repariert (`1e 27` → `1e+27`), damit bestehende
  Einträge nicht verloren gehen.
- Gesendet wird mit zwei Versuchen statt einem, zusätzlich beim Verlassen der
  Seite.

**Bestenliste in der Statistik**
- Lädt sich beim Öffnen und danach **jede Minute** von allein nach.
- Eine Zeile sagt, wie es um den eigenen Eintrag steht — angekommen, auf welchem
  Platz, oder dass der letzte Versuch scheiterte. Ein stiller Fehlschlag sah
  vorher so aus, als nehme die Liste einen einfach nicht auf.
- Wer nicht unter den besten drei steht, sieht **seine eigene Zeile** darunter
  angehängt.
- Der Knopf heißt *Jetzt aktualisieren* und sendet den eigenen Stand mit.

**Kleinigkeiten**
- Unter dem Reifegrad-Balken steht die **Restzeit** bis zur nächsten Stufe. Jede
  Stufe braucht die 2,5-fache Biomasse — ohne diese Angabe wirkt der Balken
  mitten im Spiel wie eingefroren, obwohl er sich völlig normal verhält.
- Ein Ziel, das sofort erreichbar ist, pulst jetzt, statt einfach voll dazustehen.
- Gespeichert wird zusätzlich bei `pagehide`; `beforeunload` kommt auf dem iPad
  oft gar nicht an.


## v2.2 – Aufgeräumt: kein Tutorial, klarere Wege, Statistik mit Rangliste

**Erklärungen statt Tutorial**
- Das Fenster „Worum geht es?" ist weg. Ein Absatz mit fünf nummerierten Sätzen vorweg liest niemand, und danach ist er verschwunden.
- Stattdessen erklärt sich **jede neue Sache im Moment ihres Auftauchens** — einmalig, als kurze Meldung: die erste Struktur, der erste Wachstumspunkt, die erste goldene Spore, der erste Autokäufer, der erste mögliche Sporenflug, die Symbiose, das Offline-Wachstum.

**Startbildschirm**
- Die Zeilen der Spielstände sind sauber ausgerichtet: Umbenennen, Löschen und Pfeil gleich groß und mittig.
- **Umbenennen** ist neu — und zieht den Namen über die feste Kennung auch in der Bestenliste nach, sonst stünde der Spielstand dort weiter unter dem alten.
- Fußzeile und der Knopf „Über das Spiel" sind entfallen.

**Erfolge**
- 59 Kacheln in einer Reihe sagten nicht, worauf man hinarbeitet. Jetzt in fünf farbige Gruppen sortiert — *Biomasse*, *Strukturen*, *Reifegrad und Skillbaum*, *Sporen und Symbiose*, *Nebenbei* — jede mit eigenem Farbton und dem Stand (etwa `6 / 13`).

**Statistik**
- Die **Bestenliste steht jetzt oben** — die besten drei, auf Knopfdruck die ganze Liste. Darunter erst die eigenen Werte.
- Die eigenen Werte sind in vier Gruppen sortiert (*Gerade eben*, *Insgesamt*, *Skillbaum und Sporen*, *Nebenbei*) statt achtzehn gleichrangiger Kacheln.
- Der Reiter ist von Anfang an sichtbar.

**Optionen**
- Liegen nur noch hinter dem Menü oben rechts und haben einen **Rückweg ins Startmenü**, um den Spielstand zu wechseln.
- Der Namensbereich ist entfallen — umbenannt wird am Spielstand selbst.


## v1.8 – Prüfungen raus, Kern zeigt den Fortschritt

**Prüfungen entfernt**
- Sie waren als freiwillige Handicaps gedacht, spielten sich aber zäh: Man setzte seinen Durchlauf zurück, um dieselbe Schleife mit schlechteren Zahlen zu wiederholen. Alles, was daran hing, ist mit weg — Reiter, Skillknoten, Mutation „Prüfungsmeister", drei Erfolge und das Feld in der Bestenliste.
- An die Stelle des Skillknotens tritt **Grabungen** (+8 % Produktion je Stufe), an die Stelle der drei Erfolge treten *Meilenstein*, *Breit aufgestellt* und *Langer Atem*.

**Der Kern zeigt, wie weit du bist**
- Der Nähr-Orb sitzt jetzt **mittig** statt links am Rand.
- Ein Ring um ihn füllt sich bis zum nächsten Reifegrad.
- Der Orb wird mit steigendem Reifegrad **größer und heller**, und alle fünf Reifegrade wächst eine weitere Hyphe aus ihm heraus. Vorher sah er bei Reifegrad 2 genauso aus wie bei 80.

**Bedienung**
- Die **Optionen** liegen nur noch hinter dem Menü oben rechts — die Reiterleiste ist damit auf das Spiel selbst beschränkt.
- **Musik startet aus.** Wer sie will, schaltet sie über das ♫ oben rechts ein.


## v1.6 – Der Baum baut sich wirklich auf

**Skillbaum**
- **Nebel**: Sichtbar ist nur, was gekauft wurde und was unmittelbar daran anschließt. Alles weiter außen taucht erst auf, wenn der Weg dorthin gekauft ist — der Baum wächst also wirklich mit, statt von Anfang an fertig dazustehen.
- **Clean statt schwarze Blöcke**: Ungekaufte Knoten sind nur noch eine Kontur in der Astfarbe, gekaufte sind gefüllt. Der schwarze Vollkörper wirkte bei eckigen Formen wie ein Klotz.
- **Ast-Überschriften wandern mit**: Sie sitzen immer knapp hinter dem äußersten sichtbaren Knoten ihres Astes, statt weit weg im Leeren zu schweben.
- **Ansicht passt sich selbst ein**: Beim Öffnen wird so gezoomt, dass alles Sichtbare hineinpasst — mit jedem neuen Knoten also automatisch etwas weiter heraus.
- Zoom-Knöpfe, Hinweiszeile und die Beschriftung „Ursprung" sind entfallen. Ziehen und Zoomen erklärt sich von selbst.
- **„Skillbaum zurücksetzen" ist weg.** Wer den Baum aufbaut, soll ihn nicht mit einem Klick wieder einreißen.
- Die Wegkrümmung variiert leicht je Knoten, damit auch innerhalb eines Astes nicht jeder Weg gleich aussieht.

**Sporen-Reiter entrümpelt**
- Die achtzehn Mutationen standen als eine Wand gleich aussehender Karten da. Jetzt sind sie in drei Gruppen sortiert, jede mit einer Zeile dazu, was sie bewirkt: *Mehr Produktion*, *Sporen und Neustart*, *Bequemer spielen*.
- Die Karten sind kompakter, die Kosten stehen im Knopf. Der Kopfbereich ist von fünf auf drei Kennzahlen gekürzt.

**Musik und Klänge**
- Die Musik war zu düster und zu langsam: Sie lag eine Oktave tiefer und in Moll. Jetzt dur-gefärbt, heller liegend, mit doppelt so schnellem Akkordwechsel und häufigeren Tropfentönen.
- **Eigener Lautstärkeregler für die Klänge**, getrennt von der Musik.


## v1.4 – Jeder Ast sieht anders aus

- Bisher unterschieden sich die sechs Äste nur durch die Farbe — Wege und Knoten waren überall gleich. Jetzt hat **jeder Ast eine eigene Formensprache**: Wachstum eine geschwungene Ader mit runden Knoten, Effizienz rechte Winkel und Sechsecke, Symbiose zwei Stränge und Rauten, Automatik Schienen mit Schwellen und Riegeln, Zersetzung gestrichelte Wege und unregelmäßige Schollen, Tiefe einen punktierten Schacht mit Dreiecken.
- Die **Reihenfolge im Kreis** ist neu sortiert: Verwandtes liegt nebeneinander. Oben Wachstum, daneben Symbiose, dann Tiefe, unten Automatik und Zersetzung, links Effizienz.
- Die Ast-Beschriftung nennt jetzt **den Zweck in Klartext** — „mehr Produktion", „kauft und klickt für dich" — plus die Zahl der gekauften Stufen. Damit muss man nicht mehr suchen, wo was liegt.
- Die **Legende ist entfallen**. Bei einem Skilltree braucht es keine: Die Information gehört an den Ast selbst.
- Die Bestenliste schnitt den Namen nach vier Zeichen ab, obwohl er das Wichtigste ist. Die Zeile zeigt jetzt nur Rang, Name und Reifegrad — alles andere erscheint beim Aufklappen.


## v1.3 – Der Baum wächst sichtbar mit

- Das eingefärbte Segment eines Astes reicht jetzt nur so weit nach außen, **wie dieser Ast ausgebaut ist**. Ein Ast ohne Investition ist bloß ein Ansatz am Kern; mit jedem gekauften Knoten schiebt sich das Segment weiter — das Myzel breitet sich sichtbar in diese Richtung aus. Der Übergang ist animiert.
- Unter jeder Ast-Beschriftung steht die Zahl der gekauften Stufen, etwa `45 / 124`. Damit ist auf einen Blick zu sehen, wo viel und wo wenig passiert ist.
- Die Legende hebt beim Überfahren den zugehörigen Ast hervor (vorher wirkungslos, weil eine Opazität über 1 von Browsern auf 1 begrenzt wird).


## v1.2 – Spielstände, Musik, Bestenliste mit Einzelheiten

**Drei Spielstand-Plätze**
- Der Startbildschirm zeigt jetzt drei Plätze nebeneinander: belegte zum Weiterspielen mit Name, Reifegrad, Biomasse und Spielzeit, freie zum Anlegen. Jeder Platz lässt sich einzeln löschen.
- Ein vorhandener Einzelspielstand wandert beim ersten Start automatisch auf Platz 1 — niemand verliert Fortschritt.
- Beim Anlegen wird der **Name abgefragt** und ist Pflicht. Grund: Das Spiel trägt sich von selbst in die Bestenliste ein, und ein leerer Name taugt dort nichts.

**Bestenliste**
- Der Stand wird **automatisch** eingetragen — höchstens alle 90 Sekunden und nur, wenn sich etwas geändert hat. Abschaltbar in den Optionen.
- Die Liste zeigt jetzt Reifegrad, Biomasse, Sporenflüge und Biome nebeneinander. **Eine Zeile antippen** klappt alles Weitere auf: beste Produktion, Symbiose-Punkte, Skill-Stufen, Erfolge, Prüfungsstufen, goldene Sporen, Spielzeit und wann zuletzt gespielt wurde.

**Musik**
- Ein ruhiger Klangteppich, der **live erzeugt** wird statt aus einer Datei zu kommen: drei Dauerstimmen mit Schwebung, eine Akkordfolge aus sechs Stufen, einzelne Tropfentöne aus der A-Moll-Pentatonik, dazu Tiefpassfilter und Echo. Er wiederholt sich nie.
- Eigener Knopf in der Kopfzeile, Lautstärkeregler in den Optionen. Getrennt von den Klängen bei Klicks und Käufen.

**Skillbaum: klarer erkennbar**
- Jeder Ast liegt jetzt auf einem **eingefärbten Kreissegment** — damit ist auf einen Blick klar, was wozu gehört. Die Legende hebt beim Überfahren den Ast hervor und dimmt die übrigen.
- Von 9 auf **21 Querverbindungen** erhöht. Sie sind auch ungekauft schwach zu sehen: Das Netz ist da, es leuchtet nur noch nicht.
- Ast-Beschriftungen tragen jetzt das Zeichen des Astes.

**Kleinigkeiten**
- Die Reiter-Zeile zeigte am rechten Rand eine Scrollleiste. Sie ist ausgeblendet, das waagerechte Scrollen auf schmalen Bildschirmen bleibt.
- Der Hinweis zum automatischen Speichern war als grüner Kasten deutlich klobiger als alles daneben — er sieht jetzt aus wie die übrigen Zeilen.
- Tasten aufgeräumt: **`S` löst die Symbiose aus**. Die Speichern-Taste ist weg, weil ohnehin automatisch gespeichert wird, und die Reiter-Tasten `Q W E R T Z` sind entfallen.
- Einzahl statt Plural bei „Noch 1 Wachstumspunkt nötig".


## v1.1 – Skillbaum neu aufgesetzt, globale Bestenliste, Touch

**Skillbaum: Anordnung**
- Der Baum war faktisch ein Stern aus sechs Speichen: Der Winkel eines Knotens hing nur an Ast und Platz, und die Streuung **sank** nach außen (`30 − Ring × 1,6`). Jede Gabelung lief dadurch wieder zur Astachse zusammen.
- Jetzt ein **radiales Baumlayout**: Jeder Ast belegt einen festen Kreisausschnitt von 48°, innerhalb dessen Geschwister den Platz im Verhältnis zu ihrer Zweiggröße aufteilen. Eine Gabelung bleibt bis nach außen sichtbar, und nichts überlappt mehr — der kleinste Knotenabstand liegt bei 74 px bei 42–50 px breiten Knoten.
- Verbindungen sind **geschwungen** statt gerade und werden nach außen dünner.
- **Verwebungen**: neun sichtbare Querverbindungen zwischen benachbarten Ästen. Sie leuchten erst auf, wenn beide Enden gekauft sind — das Netz schließt sich also sichtbar mit dem Fortschritt.
- **Schlüsselknoten** (alles, was etwas freischaltet) sind größer und tragen einen rotierenden Ring.

**Skillbaum: Struktur**
- Jeder Ast gabelt sich einmal und führt beide Zweige nach außen weiter. Vorher war jeder Ast eine durchgehende Kette.
- Die **Automatik** war am schlimmsten: acht fast gleiche Autokäufer hintereinander. Sie laufen jetzt als zwei parallele Linien nebeneinander.
- Die Struktur steht als lesbare Tabelle (`PARENT`) in `js/data.js` statt implizit in der Reihenfolge des Arrays. Ein Sicherheitsnetz meldet Kreisbezüge.
- Die Kostenvergabe läuft jetzt **nach** dem Umsortieren, damit sie zum tatsächlichen Ring passt.

**Skillbaum: Logik**
- Neu: **Freischalt-Bedingungen** (`GATE`). Vorher ließ sich zum Beispiel „Sporenbildung" ausbauen, bevor der erste Sporenflug überhaupt möglich war — ein Punkt, der ins Leere ging. Betroffen sind 22 Knoten: Struktur-Boni brauchen die jeweilige Struktur, alles rund um Sporen braucht mindestens einen Sporenflug.
- Der Knoten sagt jetzt in Klartext, **warum** er gesperrt ist.

**Knotenfenster**
- Wer einen Knoten ausgewählt hatte und danach einen Reifegrad aufstieg, sah weiter „Verfügbar: 0" und einen ausgegrauten Knopf. Das Fenster lebt jetzt mit: Neue Punkte schalten den Kaufknopf sofort frei. Neu gezeichnet wird nur bei Wechsel der Auswahl oder der Stufe — sonst würde es flackern.

**Globale Bestenliste**
- Die Liste lag bisher nur auf dem eigenen Gerät. Jetzt läuft sie über [textdb.online](https://textdb.online) — denselben kostenlosen Key-Value-Speicher wie beim Wahlwächter. Sortiert nach Reifegrad, bei Gleichstand nach der gesamten Biomasse.
- Jeder Spielstand bekommt eine dauerhafte Kennung, damit erneutes Senden den eigenen Eintrag aktualisiert statt einen zweiten anzulegen. Beim Schreiben laufen bis zu drei Versuche, weil gleichzeitige Zugriffe sich sonst überschreiben.
- Fällt der Dienst aus, erscheint der zuletzt geladene Stand. Das Spiel wartet nie auf eine Antwort.

**Spielstand-Ansicht**
- Fünf Knöpfe für im Grunde zwei Vorgänge sind weg. Stattdessen steht dort klar, dass **automatisch gespeichert wird** — samt Zeitpunkt der letzten Speicherung.
- Geblieben sind „Sicherung speichern" (Datei) und „Sicherung laden" (Datei oder eingefügter Text).

**Touch, Tablet, Handy**
- Der Skillbaum lässt sich mit **zwei Fingern zoomen**, Doppeltipp setzt die Ansicht zurück. Vorher ging das auf Tablets nur über die kleinen Plus/Minus-Knöpfe.
- Alle Schaltflächen auf Touchgeräten mindestens 44 px hoch, Schalter und Reiter größer.
- Unter 700 px blendet sich die Legende aus — sie verdeckte ein Drittel der Baumfläche.
- Eigenes Kartenraster und schmaleres Knotenfenster für Tablets.

**Suchmaschinen**
- Das Favicon ist jetzt eine **echte Datei** (`assets/favicon.svg`) statt eines `data:`-URI. Der Browser zeigte den zwar im Tab an, Google konnte ihn aber nicht abrufen — in der Suche und in der Search Console blieb das Bild leer.
- Nachweis-Meta-Tag für die Google Search Console ergänzt. Es muss stehen bleiben, sonst gilt die Seite als unbestätigt.
- `robots.txt` und `sitemap.xml` angelegt.

**Neue Taste**
- `Y` löst die Symbiose aus, passend zu `P` für den Sporenflug.

**Dokumentation**
- Vollständiger Satz angelegt: `KONZEPT.md`, `CLAUDE.md`, `docs/TECHNIK.md`, `docs/SPIELANLEITUNG.md` und dieser Verlauf.

---

## v1.0 – Erste Fassung

**Aufbau**
- Sechs Schichten: Klicken, acht Strukturen, Reifegrad, Skillbaum mit 72 Knoten, Sporenflug mit 18 Mutationen, Symbiose mit acht Biomen.
- Dazu vier Prüfungen mit je drei Stufen, 59 Erfolge, Autokäufer, Offline-Wachstum, goldene Sporen, Waldmeldungen als Ticker.
- Kein Build, keine Abhängigkeiten, alles in klassischen `<script>`-Dateien.

**Balance — zwei Fehler, die das Spiel binnen Stunden ins Unendliche trieben**

Aufgedeckt durch eine kopflose Simulation über hunderte Spielstunden:

- Die **Untergrenze des Kostenwachstums** lag bei 1,025 und damit **unter** dem Meilenstein-Wachstum von 2^(1/25) = 1,0281. Jede weitere Struktur produzierte dadurch mehr, als sie kostete — eine Geldmaschine ohne Ende. Die Untergrenze liegt jetzt bei 1,10, und die Kostensenkungen im Ast *Effizienz* wurden von zusammen 0,165 auf 0,112 zurückgenommen.
- Der **Sporen-Gewinn-Multiplikator** erreichte ×6000 und hebelte damit die natürliche Bremse aus, dass ein Sporenflug immer längere Durchläufe braucht. Er liegt jetzt bei etwa ×18, der Exponent bei 0,35 statt 0,5, und die Sporen-Kurve ist zusätzlich gedämpft.
- Ergänzend: ein **weicher Deckel** auf den Gesamtmultiplikator ab 1e11.
- Zwei Mutationen potenzierten den eigenen Fortschritt (`(1 + 0,02 × Reifegrad)^8`) und wurden linear gemacht.
- Das **Startkapital** nach einem Sporenflug zählte als Ertrag und erzeugte dadurch aus dem Nichts Sporen für den nächsten Flug.

**Oberfläche**
- Die Prestige-Bereiche wurden zehnmal pro Sekunde per `innerHTML` neu aufgebaut. Dabei entstanden Knöpfe und Eingabefelder jedes Mal neu — sie flackerten und ließen sich weder anklicken noch beschriften, weshalb sich der automatische Sporenflug nicht einstellen ließ. Alle Reiter bauen ihre Bereiche jetzt einmal auf und aktualisieren danach nur noch Werte.
- Der Hintergrund verschluckte die Oberfläche; im Spiel liegt jetzt ein dunkler Schleier über dem wachsenden Myzel.
- Die deutschen Zahlwörter waren fehlerhaft (doppeltes „Qrd", „M" statt „Mio").
