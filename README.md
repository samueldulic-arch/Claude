# 🪂 Der Dümmste fliegt

Ein Quiz-Partyspiel für **2 bis 10 Spieler** an einem Gerät – im Stil der bekannten
YouTube-/Twitch-Runden. Wer am wenigsten weiß, fliegt raus. Der Letzte gewinnt.

**Läuft komplett offline im Browser.** Kein Server, keine Installation, keine Accounts.

## Spielen

`index.html` im Browser öffnen (Doppelklick reicht) – fertig.
Am schönsten auf einem Laptop/Tablet, das ihr in der Runde weiterreicht.
Auf dem Handy funktioniert es genauso.

## Ablauf

1. **Spielerzahl wählen** (2–10) und Namen eintragen.
2. Optional: Einstellungen anpassen.
3. **Spiel starten** – das Gerät wandert reihum, jeder beantwortet seine Frage.
4. Am Ende: Endstand mit Sieger, „dem Dümmsten“ und Quote jedes Spielers.

## Drei Spielmodi

| Modus | Regel |
| --- | --- |
| **Rundenmodus** (Standard) | Jede Runde beantworten alle gleich viele Fragen. Wer am Rundenende die wenigsten richtig hat, **fliegt raus**. Bei Gleichstand gibt es ein **Stechen**: die Betroffenen bekommen Extrafragen, bis einer allein daneben liegt. |
| **Abstimmungsmodus** | Erst wird gespielt, dann gerichtet. Nach einer einstellbaren Zahl Runden (Standard: 2) stimmen alle reihum ab, **welche Antwort die dümmste war**. Wer die meisten Stimmen kassiert, **verliert ein Leben** – wer keins mehr hat, fliegt raus. Bei Gleichstand entscheidet ein Stechen. |
| **Lebenmodus** | Reihum eine Frage. Jede falsche Antwort kostet ein Leben (1–5 einstellbar). Wer keine Leben mehr hat, fliegt raus. |

In allen Modi läuft das Spiel, bis nur noch einer übrig ist.

### Wie der Abstimmungsmodus abläuft

1. Zwei Runden lang beantwortet jeder seine Fragen (bei 1 Frage pro Runde sind das 2 Fragen pro Person).
2. Danach stimmt jeder einmal ab. Zur Auswahl stehen alle **falschen** Antworten aus diesen Runden –
   mit Name, Frage und der richtigen Lösung daneben. Für die eigene Antwort kann niemand stimmen.
   Lag ausnahmsweise niemand daneben, wird über alle gegebenen Antworten abgestimmt.
3. Das Ergebnis erscheint als Balkendiagramm. Wer die meisten Stimmen hat, verliert ein Leben.
4. Danach geht es in die nächsten zwei Runden – bis jemand keine Leben mehr hat und rausfliegt.

Die Zahl der Leben stellt ihr selbst ein (1–5, Standard 3). Mit **1 Leben** fliegt der Dümmste
sofort nach der ersten Abstimmung raus, mit 3 Leben braucht es drei verlorene Abstimmungen.

## Zwei Ansichten

**Handy-Ansicht** (Standard): Das Gerät wandert reihum, jede Frage hat vier Antworten zum Antippen.

**Moderatoransicht**: Einer liest vor und wertet, alle anderen antworten frei aus dem Kopf.
Auf dem Bildschirm des Moderators steht:

- die Frage groß zum Vorlesen,
- die **Lösung** klein darunter (nur für den Moderator),
- ein optionales Feld, in das er tippen kann, **was die Person geantwortet hat**,
- die Knöpfe **✓ Richtig** und **✗ Falsch**.

Die vier Antwortmöglichkeiten bleiben verborgen – bis der Moderator sie braucht: Ein Klick auf
**Antwortmöglichkeiten einblenden** zeigt sie zum Vorlesen, und ein Klick auf die genannte Antwort
wertet direkt. Unter *Antwortmöglichkeiten vorlesen* legt ihr fest, wann das automatisch passiert:
nie, **nur bei ★★★★ Ultra** (Standard), ab „schwer“ oder immer.

Ist eine Bedenkzeit eingestellt, startet sie in dieser Ansicht **nicht** automatisch, sondern per
Knopfdruck – so frisst das Vorlesen keine Zeit. Der „Du bist dran“-Bildschirm entfällt, das Gerät
bleibt ja beim Moderator.

Was der Moderator ins Antwortfeld tippt, taucht im Abstimmungsmodus wieder auf: Dort steht dann
wörtlich, was jemand geraten hat – und genau darüber wird abgestimmt.

Tastatur für den Moderator: <kbd>R</kbd> richtig, <kbd>F</kbd> falsch (solange der Cursor nicht im
Textfeld steht), <kbd>1</kbd>–<kbd>4</kbd> für eine eingeblendete Antwort.

## Einstellungen

- **Fragen pro Spieler und Runde**: 1–5 (Runden- und Abstimmungsmodus)
- **Runden bis zur Abstimmung**: 1–4 (Abstimmungsmodus)
- **Leben pro Spieler**: 1–5 (Leben- und Abstimmungsmodus)
- **Bedenkzeit**: 10 / 15 / 20 / 30 / 45 Sekunden oder ohne Zeitlimit
- **Schwierigkeit**: ansteigend (Runde 1–2 leicht, 3–4 mittel, 5–6 schwer, ab 7 ultra), oder fest auf leicht, mittel, schwer, ★★★★ Ultra bzw. bunt gemischt
- **Kategorien**: einzeln an- und abwählbar
- **Moderatoransicht** und **Antwortmöglichkeiten vorlesen**: nie / bei schweren Fragen / immer
- **Ja/Nein-Fragen**: mitspielen oder komplett weglassen
- **Sound** (kleine Töne, ohne Audiodateien) und **„Du bist dran“-Bildschirm** zum Weiterreichen

Einstellungen und Namen werden im Browser gespeichert und beim nächsten Start wieder geladen.

## Handicap

Hinter jedem Namen sitzt ein kleiner Knopf, der drei Zustände durchläuft:

| | Bedeutung |
| --- | --- |
| **=** | normale Fragen |
| **▲** | eine Stufe schwerer |
| **▼** | eine Stufe leichter |

Gedacht für die Runde, in der immer dieselbe Person gewinnt: Wer alles weiß, bekommt mit ▲
durchgehend härtere Fragen, ohne dass jemand absichtlich danebenliegen muss. Über die höchste
bzw. niedrigste Stufe hinaus geht es nicht. Das Handicap steht während des Spiels klein neben dem
Namen in der Punkteleiste und wird zusammen mit den Namen gespeichert.

## Angefangenes Spiel fortsetzen

Der Spielstand wird vor jeder Frage automatisch gesichert. Wenn der Tab zugeht, das Handy zusperrt
oder jemand versehentlich neu lädt, steht beim nächsten Start oben eine Karte:
**„Angefangenes Spiel – Runde 4, 3 von 5 Spielern übrig, vor 12 Minuten"** mit den Knöpfen
*Spiel fortsetzen* und *Verwerfen*.

Fortgesetzt wird am Anfang der Frage, die gerade dran war – eine angefangene Frage wird also neu
gestellt, gewertet war sie ja noch nicht. Punkte, Leben, Rauswürfe, Rundenstand und eine laufende
Abstimmung bleiben erhalten. Am Spielende und beim Abbrechen wird der Stand gelöscht.

## Wenn etwas schiefgeht

Zwei Knöpfe für den Ernstfall am Spieleabend:

- **↺ Doch richtig / Doch falsch** — steht unter jeder Auflösung. Falsch getippt? Ein Klick dreht die
  Wertung um: Punkt, Leben und Rundenstand werden zurückgerechnet, die Auflösung ist als
  *(korrigiert)* markiert. Funktioniert, solange ihr nicht auf „Weiter“ geklickt habt, und beliebig
  oft hin und her.
- **↷ Andere Frage** — überspringt die aktuelle Frage und zieht eine neue für denselben Spieler.
  Ohne Wertung, ohne Punktverlust.
- **⚑ Frage ist falsch** — meldet eine fehlerhafte Frage. Sie kommt danach nie wieder dran und
  landet in einer Liste im Einrichtungsbildschirm. Dort könnt ihr die Liste als Text kopieren und
  weitergeben, damit die Fragen korrigiert werden. Der Knopf steht in der Moderatoransicht direkt
  bei der Frage und nach jeder Auflösung.

## Fragengedächtnis

Das Spiel merkt sich, welche Fragen auf diesem Gerät schon dran waren – auch über Spielabende hinweg.
Beim nächsten Start kommen zuerst die Fragen, die ihr noch nie hattet. Erst wenn der Vorrat der
gewählten Kategorien fast aufgebraucht ist, fängt das Spiel wieder von vorn an.

Im Einrichtungsbildschirm steht, wie viele Fragen schon verbraucht sind; ein Klick auf
**Gedächtnis zurücksetzen** stellt den kompletten Katalog wieder her.

## Steuerung

- Antworten per Klick/Tipp oder mit den Tasten <kbd>1</kbd>–<kbd>4</kbd> bzw. <kbd>A</kbd>–<kbd>D</kbd>
- Weiter mit <kbd>Leertaste</kbd> oder <kbd>Enter</kbd>

## Fragenkatalog

Aktuell **1.505 deutsche Fragen** in 12 Kategorien:

- **1.383 Multiple-Choice-Fragen** mit je 4 Antwortmöglichkeiten
- **122 Ja/Nein-Fragen** mit zwei großen Antwortknöpfen

Vier Schwierigkeitsstufen: **288 leicht · 639 mittel · 323 schwer · 255 ★★★★ Ultra**.

Ultra ist die Stufe für Leute, die sonst alles wissen – Jahreszahlen, Einheiten, Hauptstädte
abseits der üblichen Verdächtigen. In der Moderatoransicht ist das die einzige Stufe, bei der
standardmäßig vier Antwortmöglichkeiten eingeblendet werden.

Kategorien: Allgemeinwissen · Geografie · Geschichte · Wissenschaft · Sport · Musik ·
Film & TV · Gaming & Internet · Essen & Trinken · Natur & Tiere · Sprache & Wörter · Marken & Logos

### Eigene Fragen ergänzen

Alles steht in `js/fragen.js`. Für eine Multiple-Choice-Frage eine Zeile anhängen:

```js
q("Kategorie", 2, "Wie lautet die Frage?", "Richtige Antwort", "Falsch 1", "Falsch 2", "Falsch 3"),
```

Für eine Ja/Nein-Frage im Block darunter:

```js
jn("Kategorie", 2, "Ist die Behauptung wahr?", true),   // true = „Ja“ ist richtig
```

Der zweite Wert ist jeweils die Schwierigkeit: `1` = leicht, `2` = mittel, `3` = schwer, `4` = ultra.
Bei Multiple Choice steht die richtige Antwort immer direkt hinter der Frage und wird im Spiel
automatisch mit den falschen gemischt. Bei Ja/Nein steht „Ja“ immer links.
Eine neue Kategorie taucht automatisch in der Kategorieauswahl auf.

## Dateien

```
index.html      Grundgerüst
css/style.css   Aussehen
js/fragen.js    Fragenkatalog
js/app.js       Spiellogik
```
