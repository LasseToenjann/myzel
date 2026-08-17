# Konzept

Warum das Spiel so ist, wie es ist. Die Regeln stehen in der
[Spielanleitung](docs/SPIELANLEITUNG.md), der Aufbau in [docs/TECHNIK.md](docs/TECHNIK.md).

---

## Der Ausgangspunkt

Ein Skilltree ist bereits ein Netzwerk. Statt ihn als Menü über ein beliebiges Thema
zu legen, sollte das Netzwerk selbst das Thema sein — also ein **Myzel**, das
Pilzgeflecht unter dem Waldboden. Damit fallen die Genre-Mechaniken mit der
Erzählung zusammen, statt nebeneinanderher zu laufen:

| Mechanik | Im Spiel |
|---|---|
| Prestige-Reset | **Sporenflug** — der Pilz löst sich auf und verstreut sich |
| Offline-Fortschritt | die **Nacht**, in der es einfach weiterwächst |
| Skilltree | das **Myzel** selbst, radial von einem Ursprung nach außen |
| Meta-Prestige | **Symbiose** mit einem ganzen Lebensraum |

Der Ton ist ruhig und kein bisschen ironisch. Ein Pilz hat es nicht eilig.

## Was das Genre erfolgreich macht

Aus den Klassikern (Cookie Clicker, Antimatter Dimensions, Universal Paperclips)
lassen sich drei Dinge ableiten, die hier bewusst umgesetzt sind:

**1. Es müssen immer Entscheidungen anstehen.** Der häufigste Fehler des Genres ist,
zu früh passiv zu werden — sobald nichts mehr zu entscheiden ist, gibt es keinen
Grund zurückzukommen. Deshalb: eine immer sichtbare Zeile mit dem *nächsten Ziel*,
goldene Sporen, die man fangen kann, Prüfungen als freiwillige Nebenziele und ein
Skillbaum, der nie ganz voll wird.

**2. Prestige-Schichten müssen neue Mechanik freischalten, nicht nur Zahlen.** Der
Sporenflug bringt die Mutationen, die Symbiose bringt die Biome — und die Biome
öffnen wiederum gesperrte Ringe im Skillbaum. Jede Schicht verändert, womit man
sich beschäftigt.

**3. Das Tempo darf die Aufmerksamkeit nicht überholen.** Deshalb keine
Kettenreaktion, in der binnen Minuten alles fällt.

## Die zentrale Entscheidung: Der Skillbaum bleibt

Seine Punkte kommen aus dem **Reifegrad**, und der beruht auf der *insgesamt jemals*
erzeugten Biomasse — einem Wert, der nie sinkt. Kein Reset im Spiel nimmt dem
Skillbaum etwas weg.

Das ist der Unterschied zwischen „ich muss weiterspielen, sonst war es umsonst" und
„ich kann jederzeit aufhören". Ein Spiel, das nebenbei laufen soll, darf keine Angst
erzeugen. Dass sich Punkte jederzeit kostenlos neu verteilen lassen, gehört dazu:
Ausprobieren darf nichts kosten.

## Die Schichten und ihre Aufgabe

| Schicht | Aufgabe im Spannungsbogen |
|---|---|
| Klicken | Rückmeldung in der ersten Sekunde |
| Strukturen | die kurze Schleife: kaufen, wachsen, wieder kaufen |
| Reifegrad | der Faden, der durch alles hindurchläuft |
| Skillbaum | Entscheidungen und die große Langzeit-Senke |
| Sporenflug | der erste Schnitt — loslassen und stärker wiederkommen |
| Symbiose | der zweite Schnitt, der den Baum weiter öffnet |

Die Meilensteine (jede 25. Struktur verdoppelt) geben der Kaufschleife ein
Nahziel — man kauft nicht ins Leere, sondern auf die nächste Verdopplung hin.

## Balance als Entwurfsproblem

Ein Incremental lebt von exponentiellem Wachstum, und genau daran stirbt es auch.
Zwei Rückkopplungen haben dieses Spiel während der Entwicklung binnen weniger
Stunden ins Unendliche getrieben — beide sind in
[docs/TECHNIK.md](docs/TECHNIK.md#balance-und-ihre-fallen) im Detail dokumentiert.

Die Konsequenz für den Entwurf: **Boni, die mit dem eigenen Fortschritt wachsen,
dürfen linear sein, aber nie potenziert.** Eine Mutation, die „Produktion ×
(1 + 0,02 × Reifegrad) je Stufe" gab, war bei acht Stufen ein Faktor über eine
Million — und trieb sich selbst an. Sie ist heute linear.

Geprüft wird nicht nach Gefühl, sondern mit einer Simulation: Ein Bot spielt das
Spiel hunderte Stunden lang und meldet, wann welcher Reifegrad fällt. Ein Sprung
über 50 Stufen in wenigen Minuten ist immer ein Fehler, kein Erfolgserlebnis.

## Was bewusst fehlt

- **Keine Werbung, keine Käufe, keine Energie-Leiste.** Nichts, was zum Warten oder
  Zahlen drängt.
- **Kein Konto.** Der Spielstand gehört dem Gerät; wer ihn mitnehmen will,
  exportiert ihn als Text.
- **Keine Fälschungssicherheit bei der Bestenliste.** Wer die Konsole öffnet, kann
  eintragen, was er will. Für ein Spiel dieser Art ist der Aufwand einer echten
  Absicherung nicht gerechtfertigt.
- **Kein Ende mit Abspann.** „Der Kern" markiert, dass man alles gesehen hat —
  danach läuft das Netz einfach weiter.
