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

## Einstellungen

- **Fragen pro Spieler und Runde**: 1–5 (Runden- und Abstimmungsmodus)
- **Runden bis zur Abstimmung**: 1–4 (Abstimmungsmodus)
- **Leben pro Spieler**: 1–5 (Leben- und Abstimmungsmodus)
- **Bedenkzeit**: 10 / 15 / 20 / 30 / 45 Sekunden oder ohne Zeitlimit
- **Schwierigkeit**: ansteigend (wird von Runde zu Runde schwerer), leicht, mittel, schwer oder bunt gemischt
- **Kategorien**: einzeln an- und abwählbar
- **Ja/Nein-Fragen**: mitspielen oder komplett weglassen
- **Sound** (kleine Töne, ohne Audiodateien) und **„Du bist dran“-Bildschirm** zum Weiterreichen

Einstellungen und Namen werden im Browser gespeichert und beim nächsten Start wieder geladen.

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

Aktuell **680 deutsche Fragen** in 12 Kategorien:

- **579 Multiple-Choice-Fragen** mit je 4 Antwortmöglichkeiten
- **101 Ja/Nein-Fragen** mit zwei großen Antwortknöpfen

Verteilung nach Schwierigkeit: 138 leicht · 242 mittel · 300 schwer.

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

Der zweite Wert ist jeweils die Schwierigkeit: `1` = leicht, `2` = mittel, `3` = schwer.
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
