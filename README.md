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

## Zwei Spielmodi

| Modus | Regel |
| --- | --- |
| **Rundenmodus** (Standard) | Jede Runde beantworten alle gleich viele Fragen. Wer am Rundenende die wenigsten richtig hat, **fliegt raus**. Bei Gleichstand gibt es ein **Stechen**: die Betroffenen bekommen Extrafragen, bis einer allein daneben liegt. |
| **Lebenmodus** | Reihum eine Frage. Jede falsche Antwort kostet ein Leben (1–5 einstellbar). Wer keine Leben mehr hat, fliegt raus. |

In beiden Modi läuft das Spiel, bis nur noch einer übrig ist.

## Einstellungen

- **Fragen pro Spieler und Runde**: 1–5 (Rundenmodus)
- **Leben pro Spieler**: 1–5 (Lebenmodus)
- **Bedenkzeit**: 10 / 15 / 20 / 30 / 45 Sekunden oder ohne Zeitlimit
- **Schwierigkeit**: ansteigend (wird von Runde zu Runde schwerer), leicht, mittel, schwer oder bunt gemischt
- **Kategorien**: einzeln an- und abwählbar
- **Sound** (kleine Töne, ohne Audiodateien) und **„Du bist dran“-Bildschirm** zum Weiterreichen

Einstellungen und Namen werden im Browser gespeichert und beim nächsten Start wieder geladen.

## Steuerung

- Antworten per Klick/Tipp oder mit den Tasten <kbd>1</kbd>–<kbd>4</kbd> bzw. <kbd>A</kbd>–<kbd>D</kbd>
- Weiter mit <kbd>Leertaste</kbd> oder <kbd>Enter</kbd>

## Fragenkatalog

Aktuell **279 deutsche Fragen** in 10 Kategorien, jeweils mit 4 Antwortmöglichkeiten und
drei Schwierigkeitsstufen:

Allgemeinwissen · Geografie · Geschichte · Wissenschaft · Sport · Musik ·
Film & TV · Gaming & Internet · Essen & Trinken · Natur & Tiere

### Eigene Fragen ergänzen

In `js/fragen.js` einfach eine Zeile anhängen:

```js
q("Kategorie", 2, "Wie lautet die Frage?", "Richtige Antwort", "Falsch 1", "Falsch 2", "Falsch 3"),
```

Der zweite Wert ist die Schwierigkeit: `1` = leicht, `2` = mittel, `3` = schwer.
Die Antworten werden im Spiel automatisch gemischt – die richtige steht immer an dritter Position
im Aufruf. Eine neue Kategorie taucht automatisch in der Kategorieauswahl auf.

## Dateien

```
index.html      Grundgerüst
css/style.css   Aussehen
js/fragen.js    Fragenkatalog
js/app.js       Spiellogik
```
