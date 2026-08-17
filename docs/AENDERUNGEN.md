# Änderungsverlauf

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
