/* =========================================================
   Der Dümmste fliegt – Spiellogik
   ========================================================= */
(function () {
  'use strict';

  const AVATAR_COLORS = [
    '#ffce3a', '#ff4d8d', '#4ad6ff', '#2fd67a', '#c08bff',
    '#ff9a3d', '#7ef2c9', '#ff6b6b', '#8ea2ff', '#ffd9a0'
  ];
  const KEYS = ['A', 'B', 'C', 'D'];
  const SPEICHER = 'ddf-setup-v1';
  const GEDAECHTNIS = 'ddf-gestellt-v1';

  const app = document.getElementById('app');
  const alleKategorien = [...new Set(window.FRAGEN.map(f => f.k))];

  /* ---------------------------------------------------------
     Zustand
     --------------------------------------------------------- */
  const S = {
    screen: 'setup',
    einstellungen: {
      modus: 'runde',          // 'runde' | 'leben' | 'voting'
      leben: 3,
      zeit: 20,                // Sekunden, 0 = ohne Zeitlimit
      fragenProRunde: 2,
      abstimmungNach: 2,       // Runden bis zur Abstimmung (Abstimmungsmodus)
      schwierigkeit: 'auto',   // 'auto' | 1 | 2 | 3 | 'mix'
      kategorien: alleKategorien.slice(),
      jaNein: true,            // Ja/Nein-Fragen mitspielen?
      sound: true,
      uebergabe: true,         // Zwischenbildschirm "XY ist dran"
      moderator: false,        // Ein Gerät beim Moderator, Fragen werden vorgelesen
      optionenZeigen: 'schwer' // Wann Antwortmöglichkeiten eingeblendet werden: 'nie' | 'schwer' | 'immer'
    },
    namen: ['Spieler 1', 'Spieler 2', 'Spieler 3'],
    spieler: [],
    runde: 1,
    reihenfolge: [],
    rIndex: 0,
    rundenPunkte: {},
    stechen: null,             // { kandidaten:[id], ergebnisse:{id:bool}, reihe:[id], idx:0 }
    blockRunde: 1,             // Runden seit der letzten Abstimmung
    protokoll: [],             // gegebene Antworten seit der letzten Abstimmung
    abstimmung: null,          // { kandidaten, waehler, idx, stimmen }
    gestellt: new Set(),       // schon gestellte Fragen (auch über Spielabende hinweg)
    rausFolge: [],
    pool: [],
    aktuell: null,
    timerId: null,
    restMs: 0,
    letzterTick: 0
  };

  /* ---------------------------------------------------------
     Hilfsfunktionen
     --------------------------------------------------------- */
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function mischen(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const lebende = () => S.spieler.filter(p => p.dabei);
  const spielerVon = id => S.spieler.find(p => p.id === id);

  function avatar(p, extra) {
    return `<span class="avatar${extra ? ' ' + extra : ''}" style="background:${p.farbe}">${esc(p.name.trim().charAt(0).toUpperCase() || '?')}</span>`;
  }

  /* ---------------------------------------------------------
     Sound (kleine Töne per WebAudio, keine Dateien nötig)
     --------------------------------------------------------- */
  const Sound = {
    ctx: null,
    an() { return S.einstellungen.sound; },
    hole() {
      if (!this.an()) return null;
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          this.ctx = new AC();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      } catch (e) { return null; }
    },
    ton(freq, ab, dauer, form = 'sine', laut = 0.14) {
      const ctx = this.hole();
      if (!ctx) return;
      const t = ctx.currentTime + ab;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = form;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(laut, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dauer + 0.05);
    },
    richtig() { this.ton(660, 0, 0.14); this.ton(990, 0.1, 0.25); },
    falsch()  { this.ton(200, 0, 0.2, 'sawtooth'); this.ton(120, 0.16, 0.35, 'sawtooth'); },
    raus()    { [520, 420, 330, 240].forEach((f, i) => this.ton(f, i * 0.13, 0.3, 'triangle')); },
    sieg()    { [523, 659, 784, 1047].forEach((f, i) => this.ton(f, i * 0.13, 0.4, 'triangle')); },
    tick()    { this.ton(880, 0, 0.06, 'square', 0.06); }
  };

  /* ---------------------------------------------------------
     Fragen-Pool
     --------------------------------------------------------- */
  function passendeFragen() {
    const e = S.einstellungen;
    let fragen = window.FRAGEN.filter(f => e.kategorien.includes(f.k));
    if (!e.jaNein) fragen = fragen.filter(f => !f.jn);
    return fragen;
  }

  /* Kurzer, stabiler Schlüssel je Frage – Grundlage des Fragengedächtnisses */
  function fid(f) {
    let h = 5381;
    for (let i = 0; i < f.f.length; i++) h = ((h << 5) + h + f.f.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function ladeGestellt() {
    try {
      const roh = localStorage.getItem(GEDAECHTNIS);
      S.gestellt = new Set(roh ? JSON.parse(roh) : []);
    } catch (e) { S.gestellt = new Set(); }
  }

  function speichereGestellt() {
    try { localStorage.setItem(GEDAECHTNIS, JSON.stringify([...S.gestellt])); } catch (e) { /* egal */ }
  }

  function poolAufbauen() {
    let fragen = passendeFragen();
    if (!fragen.length) fragen = window.FRAGEN.slice();

    // Fragen, die auf diesem Gerät noch nie dran waren, haben Vorrang
    let frisch = fragen.filter(f => !S.gestellt.has(fid(f)));
    if (frisch.length < Math.min(25, fragen.length)) {
      // Der Vorrat ist fast durch – Gedächtnis leeren und von vorn
      S.gestellt = new Set();
      speichereGestellt();
      frisch = fragen;
    }
    S.pool = mischen(frisch);
  }

  function zielStufe() {
    const e = S.einstellungen;
    if (e.schwierigkeit === 'mix') return 0;
    if (e.schwierigkeit !== 'auto') return Number(e.schwierigkeit);
    // Automatisch: es wird von Runde zu Runde schwerer
    if (S.runde <= 2) return 1;
    if (S.runde <= 4) return 2;
    return 3;
  }

  function frageZiehen() {
    if (!S.pool.length) poolAufbauen();
    const stufe = zielStufe();
    let idx = 0;
    if (stufe) {
      idx = S.pool.findIndex(f => f.s === stufe);
      if (idx < 0) idx = S.pool.findIndex(f => Math.abs(f.s - stufe) === 1);
      if (idx < 0) idx = 0;
    }
    const frage = S.pool.splice(idx, 1)[0];
    S.gestellt.add(fid(frage));
    speichereGestellt();
    return {
      frage,
      antworten: frage.jn ? ['Ja', 'Nein'] : mischen([frage.r, ...frage.w])
    };
  }

  /* ---------------------------------------------------------
     Einstellungen speichern / laden
     --------------------------------------------------------- */
  function speichern() {
    try {
      localStorage.setItem(SPEICHER, JSON.stringify({
        namen: S.namen,
        einstellungen: S.einstellungen,
        bekannteKategorien: alleKategorien
      }));
    } catch (e) { /* egal */ }
  }

  function laden() {
    try {
      const roh = localStorage.getItem(SPEICHER);
      if (!roh) return;
      const d = JSON.parse(roh);
      if (Array.isArray(d.namen) && d.namen.length >= 2) S.namen = d.namen.slice(0, 10);
      if (d.einstellungen) {
        Object.assign(S.einstellungen, d.einstellungen);
        S.einstellungen.kategorien = (S.einstellungen.kategorien || [])
          .filter(k => alleKategorien.includes(k));

        // Kategorien, die es beim letzten Spielabend noch nicht gab, sind automatisch dabei
        const bekannt = Array.isArray(d.bekannteKategorien) ? d.bekannteKategorien : [];
        alleKategorien.forEach(k => {
          if (!bekannt.includes(k) && !S.einstellungen.kategorien.includes(k)) {
            S.einstellungen.kategorien.push(k);
          }
        });

        if (!S.einstellungen.kategorien.length) S.einstellungen.kategorien = alleKategorien.slice();
      }
    } catch (e) { /* egal */ }
  }

  /* ---------------------------------------------------------
     Bildschirm: Einrichtung
     --------------------------------------------------------- */
  function zeigeSetup() {
    S.screen = 'setup';
    const e = S.einstellungen;
    const zahlChips = [];
    for (let n = 2; n <= 10; n++) {
      zahlChips.push(`<button class="chip num" data-anzahl="${n}" aria-pressed="${S.namen.length === n}">${n}</button>`);
    }

    app.innerHTML = `
      <div class="logo">
        <div class="kicker">Das Quiz-Partyspiel</div>
        <h1>Der Dümmste fliegt</h1>
        <p>${window.FRAGEN.length} Fragen · 2–10 Spieler · ein Gerät reicht</p>
      </div>

      <div class="card">
        <span class="label">Wie viele spielen mit?</span>
        <div class="chips">${zahlChips.join('')}</div>
      </div>

      <div class="card">
        <span class="label">Namen</span>
        <div class="players">
          ${S.namen.map((n, i) => `
            <div class="player-row">
              <span class="avatar" style="background:${AVATAR_COLORS[i % AVATAR_COLORS.length]}">${esc((n.trim()[0] || String(i + 1)).toUpperCase())}</span>
              <input type="text" data-name="${i}" value="${esc(n)}" maxlength="14" placeholder="Spieler ${i + 1}">
            </div>`).join('')}
        </div>
        <p class="hint">Tipp: Ihr spielt zusammen an einem Gerät und gebt es reihum weiter.</p>
      </div>

      <div class="card">
        <details class="settings" ${S.setupOffen ? 'open' : ''}>
          <summary>Spieleinstellungen</summary>

          <div class="setting">
            <span class="label">Spielmodus</span>
            <div class="chips">
              <button class="chip" data-set="modus" data-wert="runde" aria-pressed="${e.modus === 'runde'}">Rundenmodus – der Schlechteste fliegt</button>
              <button class="chip" data-set="modus" data-wert="leben" aria-pressed="${e.modus === 'leben'}">Leben – wer alle verliert, fliegt</button>
              <button class="chip" data-set="modus" data-wert="voting" aria-pressed="${e.modus === 'voting'}">Abstimmung – die Runde entscheidet</button>
            </div>
            <p class="hint" id="modusHinweis"></p>
          </div>

          <div class="setting" id="rundenSetting">
            <span class="label">Fragen pro Spieler und Runde</span>
            <div class="chips">
              ${[1, 2, 3, 4, 5].map(n => `<button class="chip num" data-set="fragenProRunde" data-wert="${n}" aria-pressed="${e.fragenProRunde === n}">${n}</button>`).join('')}
            </div>
          </div>

          <div class="setting" id="abstimmungSetting">
            <span class="label">Runden bis zur Abstimmung</span>
            <div class="chips">
              ${[1, 2, 3, 4].map(n => `<button class="chip num" data-set="abstimmungNach" data-wert="${n}" aria-pressed="${e.abstimmungNach === n}">${n}</button>`).join('')}
            </div>
          </div>

          <div class="setting" id="lebenSetting">
            <span class="label" id="lebenLabel">Leben pro Spieler</span>
            <div class="chips">
              ${[1, 2, 3, 4, 5].map(n => `<button class="chip num" data-set="leben" data-wert="${n}" aria-pressed="${e.leben === n}">${'❤'.repeat(n)}</button>`).join('')}
            </div>
          </div>

          <div class="setting">
            <span class="label">Bedenkzeit pro Frage</span>
            <div class="chips">
              ${[10, 15, 20, 30, 45, 0].map(n => `<button class="chip num" data-set="zeit" data-wert="${n}" aria-pressed="${e.zeit === n}">${n ? n + ' s' : 'ohne'}</button>`).join('')}
            </div>
          </div>

          <div class="setting">
            <span class="label">Schwierigkeit</span>
            <div class="chips">
              <button class="chip" data-set="schwierigkeit" data-wert="auto" aria-pressed="${e.schwierigkeit === 'auto'}">Ansteigend</button>
              <button class="chip" data-set="schwierigkeit" data-wert="1" aria-pressed="${e.schwierigkeit === '1'}">Leicht</button>
              <button class="chip" data-set="schwierigkeit" data-wert="2" aria-pressed="${e.schwierigkeit === '2'}">Mittel</button>
              <button class="chip" data-set="schwierigkeit" data-wert="3" aria-pressed="${e.schwierigkeit === '3'}">Schwer</button>
              <button class="chip" data-set="schwierigkeit" data-wert="mix" aria-pressed="${e.schwierigkeit === 'mix'}">Bunt gemischt</button>
            </div>
          </div>

          <div class="setting">
            <span class="label">Kategorien</span>
            <div class="chips">
              ${alleKategorien.map(k => `<button class="chip" data-kat="${esc(k)}" aria-pressed="${e.kategorien.includes(k)}">${esc(k)}</button>`).join('')}
            </div>
            <p class="hint" id="katHinweis"></p>
          </div>

          <div class="setting">
            <span class="label">Wie spielt ihr?</span>
            <div class="chips">
              <button class="chip" data-toggle="moderator" aria-pressed="${e.moderator}">🎤 Moderatoransicht</button>
            </div>
            <p class="hint" id="moderatorHinweis"></p>
          </div>

          <div class="setting" id="optionenSetting">
            <span class="label">Antwortmöglichkeiten vorlesen</span>
            <div class="chips">
              <button class="chip" data-set="optionenZeigen" data-wert="nie" aria-pressed="${e.optionenZeigen === 'nie'}">Nie</button>
              <button class="chip" data-set="optionenZeigen" data-wert="schwer" aria-pressed="${e.optionenZeigen === 'schwer'}">Bei schweren Fragen</button>
              <button class="chip" data-set="optionenZeigen" data-wert="immer" aria-pressed="${e.optionenZeigen === 'immer'}">Immer</button>
            </div>
            <p class="hint">Sonst blendest du sie bei jeder Frage einzeln ein.</p>
          </div>

          <div class="setting">
            <span class="label">Fragengedächtnis</span>
            <p class="hint" id="gedaechtnisHinweis" style="margin-bottom:8px"></p>
            <button class="chip" id="gedaechtnisReset">Gedächtnis zurücksetzen</button>
          </div>

          <div class="setting">
            <span class="label">Sonstiges</span>
            <div class="chips">
              <button class="chip" data-toggle="jaNein" aria-pressed="${e.jaNein}">❓ Ja/Nein-Fragen</button>
              <button class="chip" data-toggle="sound" aria-pressed="${e.sound}">🔊 Sound</button>
              <button class="chip" id="uebergabeChip" data-toggle="uebergabe" aria-pressed="${e.uebergabe}">🔁 „Du bist dran“-Bildschirm</button>
            </div>
          </div>
        </details>
      </div>

      <button class="btn block" id="start">Spiel starten</button>
      <p class="footer-note">Antworten per Klick oder mit den Tasten <kbd>1</kbd>–<kbd>4</kbd> bzw. <kbd>A</kbd>–<kbd>D</kbd>, weiter mit <kbd>Leertaste</kbd>.</p>
    `;

    aktualisiereSetupHinweise();

    app.querySelectorAll('[data-anzahl]').forEach(b => b.addEventListener('click', () => {
      const n = Number(b.dataset.anzahl);
      const alt = S.namen.slice();
      S.namen = [];
      for (let i = 0; i < n; i++) S.namen.push(alt[i] || 'Spieler ' + (i + 1));
      S.setupOffen = app.querySelector('details.settings').open;
      speichern();
      zeigeSetup();
    }));

    app.querySelectorAll('[data-name]').forEach(inp => {
      inp.addEventListener('input', () => {
        S.namen[Number(inp.dataset.name)] = inp.value;
        const av = inp.previousElementSibling;
        av.textContent = (inp.value.trim()[0] || String(Number(inp.dataset.name) + 1)).toUpperCase();
        speichern();
      });
    });

    app.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => {
      const feld = b.dataset.set;
      let wert = b.dataset.wert;
      if (['leben', 'zeit', 'fragenProRunde', 'abstimmungNach'].includes(feld)) wert = Number(wert);
      S.einstellungen[feld] = wert;
      b.parentElement.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
      aktualisiereSetupHinweise();
      speichern();
    }));

    app.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
      const feld = b.dataset.toggle;
      S.einstellungen[feld] = !S.einstellungen[feld];
      b.setAttribute('aria-pressed', S.einstellungen[feld]);
      if (feld === 'sound' && S.einstellungen[feld]) Sound.richtig();
      aktualisiereSetupHinweise();
      speichern();
    }));

    app.querySelectorAll('[data-kat]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.kat;
      const liste = S.einstellungen.kategorien;
      const i = liste.indexOf(k);
      if (i >= 0) { if (liste.length > 1) liste.splice(i, 1); }
      else liste.push(k);
      b.setAttribute('aria-pressed', liste.includes(k));
      aktualisiereSetupHinweise();
      speichern();
    }));

    app.querySelector('#gedaechtnisReset').addEventListener('click', () => {
      S.gestellt = new Set();
      speichereGestellt();
      aktualisiereSetupHinweise();
    });

    app.querySelector('#start').addEventListener('click', spielStarten);
  }

  function aktualisiereSetupHinweise() {
    const e = S.einstellungen;
    const rund = app.querySelector('#rundenSetting');
    const leb = app.querySelector('#lebenSetting');
    const abst = app.querySelector('#abstimmungSetting');
    const hin = app.querySelector('#modusHinweis');
    const kat = app.querySelector('#katHinweis');
    const ged = app.querySelector('#gedaechtnisHinweis');
    if (rund) rund.classList.toggle('hidden', e.modus === 'leben');
    if (leb) leb.classList.toggle('hidden', e.modus === 'runde');
    if (abst) abst.classList.toggle('hidden', e.modus !== 'voting');
    if (hin) {
      hin.textContent = {
        runde: 'Jede Runde beantworten alle die gleiche Anzahl Fragen. Wer am Ende der Runde die wenigsten richtig hat, fliegt raus – bei Gleichstand gibt es ein Stechen.',
        leben: 'Reihum eine Frage. Jede falsche Antwort kostet ein Leben. Wer keine Leben mehr hat, fliegt raus.',
        voting: 'Erst wird gespielt, dann gerichtet: Nach den eingestellten Runden stimmen alle ab, welche Antwort die dümmste war. Wer die meisten Stimmen bekommt, verliert ein Leben – wer keins mehr hat, fliegt raus. Bei Gleichstand entscheidet ein Stechen.'
      }[e.modus];
    }
    const modAn = e.moderator;
    const optSet = app.querySelector('#optionenSetting');
    const modHin = app.querySelector('#moderatorHinweis');
    const ueberChip = app.querySelector('#uebergabeChip');
    if (optSet) optSet.classList.toggle('hidden', !modAn);
    if (ueberChip) ueberChip.classList.toggle('hidden', modAn);
    if (modHin) {
      modHin.textContent = modAn
        ? 'Einer liest die Fragen vor und wertet: Die Frage erscheint offen, die Lösung steht klein darunter, und du tippst nur noch auf Richtig oder Falsch. Antwortmöglichkeiten kannst du bei Bedarf einblenden.'
        : 'Alle spielen an einem Gerät und geben es reihum weiter. Jede Frage hat vier Antworten zum Antippen.';
    }
    const lebLabel = app.querySelector('#lebenLabel');
    if (lebLabel) {
      lebLabel.textContent = e.modus === 'voting'
        ? 'Leben pro Spieler (1 = sofort raus)'
        : 'Leben pro Spieler';
    }
    if (ged) {
      const gesamt = window.FRAGEN.length;
      ged.textContent = S.gestellt.size
        ? `${S.gestellt.size} von ${gesamt} Fragen waren auf diesem Gerät schon dran – sie kommen erst wieder, wenn der Rest durch ist.`
        : `Noch keine Frage gestellt. Gespielte Fragen werden gemerkt, damit sich beim nächsten Mal nichts wiederholt.`;
    }
    if (kat) {
      const fragen = passendeFragen();
      const jaNein = fragen.filter(f => f.jn).length;
      kat.textContent = fragen.length + ' Fragen ausgewählt'
        + (jaNein ? ` (davon ${jaNein} Ja/Nein-Fragen)` : '') + '.';
    }
  }

  /* ---------------------------------------------------------
     Spielstart
     --------------------------------------------------------- */
  function spielStarten() {
    Sound.hole();
    S.spieler = S.namen.map((n, i) => ({
      id: i,
      name: (n || '').trim() || 'Spieler ' + (i + 1),
      farbe: AVATAR_COLORS[i % AVATAR_COLORS.length],
      leben: S.einstellungen.leben,
      dabei: true,
      richtig: 0,
      falsch: 0,
      zeit: 0
    }));
    S.runde = 1;
    S.rausFolge = [];
    S.stechen = null;
    blockZuruecksetzen();
    poolAufbauen();
    rundeAufbauen();
    naechsterZug();
  }

  function blockZuruecksetzen() {
    S.blockRunde = 1;
    S.protokoll = [];
    S.abstimmung = null;
  }

  function rundeAufbauen() {
    const aktive = lebende().map(p => p.id);
    S.rundenPunkte = {};
    aktive.forEach(id => S.rundenPunkte[id] = 0);
    const reihe = [];
    const durchgaenge = S.einstellungen.modus === 'leben' ? 1 : S.einstellungen.fragenProRunde;
    for (let d = 0; d < durchgaenge; d++) reihe.push(...aktive);
    S.reihenfolge = reihe;
    S.rIndex = 0;
  }

  /* ---------------------------------------------------------
     Zugsteuerung
     --------------------------------------------------------- */
  function naechsterZug() {
    if (S.stechen) return stechenZug();
    if (S.rIndex >= S.reihenfolge.length) return rundeBeenden();

    const pid = S.reihenfolge[S.rIndex];
    const p = spielerVon(pid);
    if (!p.dabei) { S.rIndex++; return naechsterZug(); }

    S.aktuell = Object.assign(frageZiehen(), { pid, gewaehlt: null, start: Date.now() });

    if (uebergabeNoetig()) zeigeUebergabe(p);
    else zeigeFrage();
  }

  /* Beim Moderator wandert das Gerät nicht – der Zwischenbildschirm entfällt */
  function uebergabeNoetig() {
    return S.einstellungen.uebergabe && !S.einstellungen.moderator;
  }

  function stechenZug() {
    const st = S.stechen;
    if (st.idx >= st.reihe.length) return stechenAuswerten();
    const pid = st.reihe[st.idx];
    S.aktuell = Object.assign(frageZiehen(), { pid, gewaehlt: null, start: Date.now(), stechen: true });
    if (uebergabeNoetig()) zeigeUebergabe(spielerVon(pid), 'Stechfrage!');
    else zeigeFrage();
  }

  function zeigeUebergabe(p, titel, weiter) {
    S.screen = 'uebergabe';
    app.innerHTML = kopf() + `
      <div class="card turn-card fade">
        ${titel ? `<div class="tag diff">${esc(titel)}</div>` : ''}
        ${avatar(p)}
        <h2>${esc(p.name)} ist dran</h2>
        <p class="hint">Gerät weitergeben – dann geht's los.</p>
        <br>
        <button class="btn" id="weiter">Bereit!</button>
      </div>`;
    app.querySelector('#weiter').addEventListener('click', weiter || zeigeFrage);
  }

  /* ---------------------------------------------------------
     Frage anzeigen
     --------------------------------------------------------- */
  function zeigeFrage() {
    if (S.einstellungen.moderator) return zeigeFrageModerator();
    S.screen = 'frage';
    const a = S.aktuell;
    const p = spielerVon(a.pid);
    const stufe = ['', 'Leicht', 'Mittel', 'Schwer'][a.frage.s];
    a.start = Date.now();

    app.innerHTML = kopf() + `
      <div class="card fade">
        ${S.einstellungen.zeit ? '<div class="timer" id="timer"><div></div></div>' : ''}
        <div class="meta">
          <span class="tag">${esc(a.frage.k)}</span>
          <span class="tag diff">${'★'.repeat(a.frage.s)}${'☆'.repeat(3 - a.frage.s)} ${stufe}</span>
          ${a.frage.jn ? '<span class="tag">Ja oder Nein?</span>' : ''}
          ${a.stechen ? '<span class="tag" style="background:rgba(255,77,141,.25)">Stechen</span>' : ''}
          <span class="tag">${avatar(p, 'inline')} ${esc(p.name)}</span>
        </div>
        <div class="question">${esc(a.frage.f)}</div>
        <div class="answers${a.frage.jn ? ' zwei' : ''}" id="antworten">
          ${a.antworten.map((t, i) => `
            <button class="answer" data-i="${i}">
              <span class="key">${KEYS[i]}</span><span>${esc(t)}</span>
            </button>`).join('')}
        </div>
      </div>`;

    app.querySelectorAll('.answer').forEach(b =>
      b.addEventListener('click', () => antworten(Number(b.dataset.i))));

    starteTimer();
  }

  /* ---------------------------------------------------------
     Moderatoransicht: offene Frage, der Moderator wertet
     --------------------------------------------------------- */
  function zeigeFrageModerator() {
    S.screen = 'frage';
    const a = S.aktuell;
    const e = S.einstellungen;
    const p = spielerVon(a.pid);
    const stufe = ['', 'Leicht', 'Mittel', 'Schwer'][a.frage.s];
    a.start = Date.now();

    if (a.optionenSichtbar === undefined) {
      a.optionenSichtbar = !a.frage.jn && (
        e.optionenZeigen === 'immer' || (e.optionenZeigen === 'schwer' && a.frage.s === 3)
      );
    }

    app.innerHTML = kopf() + `
      <div class="card fade">
        ${e.zeit ? `<div class="timer${a.zeitGestartet ? '' : ' idle'}" id="timer"><div></div></div>` : ''}
        <div class="meta">
          <span class="tag">${esc(a.frage.k)}</span>
          <span class="tag diff">${'★'.repeat(a.frage.s)}${'☆'.repeat(3 - a.frage.s)} ${stufe}</span>
          ${a.frage.jn ? '<span class="tag">Ja oder Nein?</span>' : ''}
          ${a.stechen ? '<span class="tag" style="background:rgba(255,77,141,.25)">Stechen</span>' : ''}
          <span class="tag">${avatar(p, 'inline')} ${esc(p.name)}</span>
        </div>

        <div class="question">${esc(a.frage.f)}</div>

        <div class="loesung">
          <span class="loesung-label">Lösung</span>
          <span class="loesung-text">${esc(a.frage.r)}</span>
        </div>

        ${a.optionenSichtbar
          ? `<p class="hint">Zum Vorlesen – ein Klick wertet direkt:</p>
             <div class="answers${a.frage.jn ? ' zwei' : ''}" id="antworten">
               ${a.antworten.map((t, i) => `
                 <button class="answer" data-i="${i}">
                   <span class="key">${KEYS[i]}</span><span>${esc(t)}</span>
                 </button>`).join('')}
             </div>`
          : `<button class="btn ghost block" id="optionen">Antwortmöglichkeiten einblenden</button>`}

        <input class="antwort-feld" id="gesagt" type="text" maxlength="60"
               placeholder="Was hat ${esc(p.name)} geantwortet? (optional)"
               autocomplete="off">

        <div class="judge">
          <button class="btn good" id="jaRichtig">✓ Richtig</button>
          <button class="btn bad" id="jaFalsch">✗ Falsch</button>
        </div>

        ${e.zeit && !a.zeitGestartet
          ? `<button class="btn ghost block" id="zeitStart" style="margin-top:10px">Bedenkzeit starten (${e.zeit} s)</button>`
          : ''}
        <p class="hint">Tastatur: <kbd>R</kbd> richtig, <kbd>F</kbd> falsch${a.optionenSichtbar ? ', <kbd>1</kbd>–<kbd>4</kbd> für die Antwort' : ''}.</p>
      </div>`;

    const feld = app.querySelector('#gesagt');
    const gesagt = () => (feld && feld.value) || '';

    app.querySelectorAll('.answer').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      const richtigIdx = a.antworten.indexOf(a.frage.r);
      wertung(i === richtigIdx, { gewaehlt: i, text: gesagt() || a.antworten[i] });
    }));

    const opt = app.querySelector('#optionen');
    if (opt) opt.addEventListener('click', () => {
      const lief = S.timerId !== null;
      const rest = S.restMs;
      const gemerkt = gesagt();
      stoppeTimer();
      a.optionenSichtbar = true;
      zeigeFrageModerator();
      const neu = app.querySelector('#gesagt');
      if (neu) neu.value = gemerkt;
      if (lief) starteTimer(rest);
    });

    app.querySelector('#jaRichtig').addEventListener('click', () => wertung(true, { text: gesagt() }));
    app.querySelector('#jaFalsch').addEventListener('click', () => wertung(false, { text: gesagt() }));

    const zeit = app.querySelector('#zeitStart');
    if (zeit) zeit.addEventListener('click', () => {
      zeit.disabled = true;
      a.zeitGestartet = true;
      a.start = Date.now();
      const bar = app.querySelector('#timer');
      if (bar) bar.classList.remove('idle');
      starteTimer();
    });
  }

  function starteTimer(rest) {
    stoppeTimer();
    if (!S.einstellungen.zeit) return;
    const gesamt = S.einstellungen.zeit * 1000;
    S.restMs = rest === undefined ? gesamt : rest;
    S.letzterTick = Math.ceil(S.restMs / 1000);
    const bar = app.querySelector('#timer');
    if (!bar) return;
    const fill = bar.firstElementChild;
    fill.style.width = Math.max(0, (S.restMs / gesamt) * 100) + '%';
    S.timerId = setInterval(() => {
      S.restMs -= 100;
      const anteil = Math.max(0, S.restMs / gesamt);
      fill.style.width = (anteil * 100) + '%';
      bar.classList.toggle('low', anteil <= 0.3);
      const sek = Math.ceil(S.restMs / 1000);
      if (sek !== S.letzterTick && sek <= 5 && sek > 0) { Sound.tick(); S.letzterTick = sek; }
      if (S.restMs <= 0) { stoppeTimer(); antworten(null); }
    }, 100);
  }

  function stoppeTimer() {
    if (S.timerId) { clearInterval(S.timerId); S.timerId = null; }
  }

  /* ---------------------------------------------------------
     Antwort auswerten
     --------------------------------------------------------- */
  function antworten(i) {
    if (S.screen !== 'frage') return;
    const a = S.aktuell;
    const richtigIdx = a.antworten.indexOf(a.frage.r);
    wertung(i !== null && i === richtigIdx, {
      gewaehlt: i,
      abgelaufen: i === null,
      text: i === null ? '' : a.antworten[i]
    });
  }

  /* Kern der Auswertung – aus der Antwortauswahl wie aus der Moderatorwertung */
  function wertung(korrekt, o) {
    if (S.screen !== 'frage') return;
    stoppeTimer();
    S.screen = 'aufloesung';

    const a = S.aktuell;
    const p = spielerVon(a.pid);
    const richtigIdx = a.antworten.indexOf(a.frage.r);
    const dauer = (Date.now() - a.start) / 1000;

    a.gewaehlt = o.gewaehlt === undefined ? null : o.gewaehlt;
    a.korrekt = korrekt;
    a.abgelaufen = !!o.abgelaufen;
    a.gesagt = (o.text || '').trim();
    p.zeit += Math.min(dauer, S.einstellungen.zeit || 60);

    if (korrekt) {
      p.richtig++;
      if (!a.stechen) S.rundenPunkte[p.id] = (S.rundenPunkte[p.id] || 0) + 1;
      Sound.richtig();
    } else {
      p.falsch++;
      Sound.falsch();
      if (S.einstellungen.modus === 'leben' && !a.stechen) p.leben--;
    }
    if (a.stechen) S.stechen.ergebnisse[p.id] = korrekt;

    if (S.einstellungen.modus === 'voting' && !a.stechen) {
      S.protokoll.push({
        pid: p.id,
        frage: a.frage.f,
        antwort: a.gesagt || (a.abgelaufen ? '(keine Antwort)' : '(nicht notiert)'),
        richtigeAntwort: a.frage.r,
        korrekt
      });
    }

    zeigeAufloesung(richtigIdx);
  }

  function zeigeAufloesung(richtigIdx) {
    const a = S.aktuell;
    const p = spielerVon(a.pid);
    const modus = S.einstellungen.modus;

    let unter;
    if (a.korrekt) {
      unter = modus === 'leben'
        ? 'Kein Leben verloren.'
        : 'Ein Punkt für diese Runde.';
    } else if (a.abgelaufen) {
      unter = 'Zeit abgelaufen! Richtig wäre: ' + esc(a.frage.r);
    } else {
      unter = 'Richtig wäre: ' + esc(a.frage.r);
    }
    if (!a.korrekt && modus === 'leben' && !a.stechen) {
      unter += p.leben > 0
        ? ` · ${esc(p.name)} hat noch ${p.leben} ${p.leben === 1 ? 'Leben' : 'Leben'}.`
        : ` · ${esc(p.name)} hat kein Leben mehr!`;
    }

    app.innerHTML = kopf() + `
      <div class="card fade">
        <div class="meta">
          <span class="tag">${esc(a.frage.k)}</span>
          <span class="tag">${avatar(p, 'inline')} ${esc(p.name)}</span>
        </div>
        <div class="question">${esc(a.frage.f)}</div>
        ${S.einstellungen.moderator
          ? `<div class="loesung">
               <span class="loesung-label">Lösung</span>
               <span class="loesung-text">${esc(a.frage.r)}</span>
             </div>
             ${a.gesagt ? `<p class="hint">Geantwortet: „${esc(a.gesagt)}“</p>` : ''}`
          : `<div class="answers${a.frage.jn ? ' zwei' : ''}">
          ${a.antworten.map((t, i) => {
            let cls = 'answer dim';
            if (i === richtigIdx) cls = 'answer correct';
            else if (i === a.gewaehlt) cls = 'answer wrong';
            return `<button class="${cls}" disabled><span class="key">${KEYS[i]}</span><span>${esc(t)}</span></button>`;
          }).join('')}
        </div>`}
        <div class="verdict ${a.korrekt ? 'good' : 'bad'}">${a.korrekt ? 'Richtig! 🎉' : 'Falsch! 💀'}</div>
        <div class="verdict-sub">${unter}</div>
        <button class="btn block" id="weiter">Weiter</button>
      </div>`;

    app.querySelector('#weiter').addEventListener('click', nachAufloesung);
  }

  function nachAufloesung() {
    const a = S.aktuell;
    const p = spielerVon(a.pid);

    if (a.stechen) {
      S.stechen.idx++;
      return stechenZug();
    }

    S.rIndex++;

    if (S.einstellungen.modus === 'leben' && p.leben <= 0) {
      return rauswurf(p, () => {
        if (spielEndeGeprueft()) return;
        if (S.rIndex >= S.reihenfolge.length) { S.runde++; rundeAufbauen(); }
        naechsterZug();
      });
    }

    if (S.rIndex >= S.reihenfolge.length && S.einstellungen.modus === 'leben') {
      S.runde++;
      rundeAufbauen();
    }
    naechsterZug();
  }

  /* ---------------------------------------------------------
     Rundenende (Rundenmodus)
     --------------------------------------------------------- */
  function rundeBeenden() {
    const e = S.einstellungen;

    if (e.modus === 'leben') {
      S.runde++;
      rundeAufbauen();
      return naechsterZug();
    }

    if (e.modus === 'voting') {
      // Erst wenn genug Runden gespielt sind, wird abgestimmt
      if (S.blockRunde < e.abstimmungNach) {
        return zeigeRundenstand(
          () => { S.blockRunde++; S.runde++; rundeAufbauen(); naechsterZug(); },
          `Noch ${e.abstimmungNach - S.blockRunde} Runde${e.abstimmungNach - S.blockRunde === 1 ? '' : 'n'}, dann wird abgestimmt.`,
          'Nächste Runde'
        );
      }
      return zeigeRundenstand(
        abstimmungStarten,
        'Alle haben geantwortet – jetzt entscheidet die Runde.',
        'Zur Abstimmung'
      );
    }

    const aktive = lebende();
    const min = Math.min(...aktive.map(p => S.rundenPunkte[p.id] || 0));
    const schlechteste = aktive.filter(p => (S.rundenPunkte[p.id] || 0) === min);

    if (schlechteste.length === 1) {
      zeigeRundenstand(() => rauswurf(schlechteste[0], nachRauswurf));
    } else {
      zeigeRundenstand(() => stechenStarten(schlechteste.map(p => p.id)));
    }
  }

  function nachRauswurf() {
    if (spielEndeGeprueft()) return;
    blockZuruecksetzen();
    S.runde++;
    rundeAufbauen();
    naechsterZug();
  }

  function zeigeRundenstand(weiter, hinweis, knopf) {
    S.screen = 'rundenende';
    const aktive = lebende().slice().sort((a, b) => (S.rundenPunkte[b.id] || 0) - (S.rundenPunkte[a.id] || 0));
    const min = Math.min(...aktive.map(p => S.rundenPunkte[p.id] || 0));
    const gleichstand = aktive.filter(p => (S.rundenPunkte[p.id] || 0) === min).length > 1;
    const text = hinweis || (gleichstand
      ? 'Gleichstand am Tabellenende – es gibt ein Stechen!'
      : 'Wer unten steht, fliegt gleich raus …');

    app.innerHTML = kopf() + `
      <div class="card fade">
        <h2>Runde ${S.runde} ist vorbei</h2>
        <p class="hint">${esc(text)}</p>
        <table class="standings">
          <tr><th>Spieler</th><th class="num">Diese Runde</th><th class="num">Gesamt richtig</th></tr>
          ${aktive.map(p => `
            <tr>
              <td>${avatar(p)} ${esc(p.name)}</td>
              <td class="num">${S.rundenPunkte[p.id] || 0}</td>
              <td class="num">${p.richtig}</td>
            </tr>`).join('')}
        </table>
        <br>
        <button class="btn block" id="weiter">${esc(knopf || (gleichstand ? 'Zum Stechen' : 'Wer fliegt raus?'))}</button>
      </div>`;
    app.querySelector('#weiter').addEventListener('click', weiter);
  }

  /* ---------------------------------------------------------
     Abstimmung: Welche Antwort war die dümmste?
     --------------------------------------------------------- */
  function abstimmungStarten() {
    const eintraege = S.protokoll.filter(e => spielerVon(e.pid).dabei);
    const falsche = eintraege.filter(e => !e.korrekt);
    const basis = falsche.length ? falsche : eintraege;

    S.abstimmung = {
      kandidaten: basis.map((e, i) => Object.assign({ key: i }, e)),
      nurFalsche: falsche.length > 0,
      waehler: lebende().map(p => p.id),
      idx: 0,
      stimmen: {}
    };
    abstimmungZug();
  }

  function abstimmungZug() {
    const ab = S.abstimmung;
    if (ab.idx >= ab.waehler.length) return abstimmungErgebnis();

    const waehler = spielerVon(ab.waehler[ab.idx]);
    // Wer nur über eigene Antworten abstimmen könnte, wird übersprungen
    if (!ab.kandidaten.some(k => k.pid !== waehler.id)) { ab.idx++; return abstimmungZug(); }

    if (uebergabeNoetig()) zeigeUebergabe(waehler, 'Abstimmung', zeigeAbstimmung);
    else zeigeAbstimmung();
  }

  function zeigeAbstimmung() {
    S.screen = 'abstimmung';
    const ab = S.abstimmung;
    const waehler = spielerVon(ab.waehler[ab.idx]);

    app.innerHTML = kopf() + `
      <div class="card fade">
        <div class="meta">
          <span class="tag">Abstimmung</span>
          <span class="tag">${avatar(waehler, 'inline')} ${esc(waehler.name)} stimmt ab</span>
          <span class="tag">${ab.idx + 1} / ${ab.waehler.length}</span>
        </div>
        <div class="question">Welche Antwort war die dümmste?</div>
        <div class="votes">
          ${ab.kandidaten.map(k => {
            const p = spielerVon(k.pid);
            const eigen = k.pid === waehler.id;
            const ohneText = k.antwort.startsWith('(');
            return `
              <button class="vote" data-key="${k.key}" ${eigen ? 'disabled' : ''}>
                <span class="vote-antwort">${ohneText ? esc(k.frage) : '„' + esc(k.antwort) + '“'}</span>
                <span class="vote-meta">${avatar(p, 'inline')} ${esc(p.name)}${ohneText ? ' · ' + esc(k.antwort) : ' · ' + esc(k.frage)}</span>
                <span class="vote-flag ${k.korrekt ? 'good' : 'bad'}">${k.korrekt
                  ? 'war richtig'
                  : 'richtig wäre: ' + esc(k.richtigeAntwort)}</span>
                ${eigen ? '<span class="vote-flag">deine eigene Antwort – nicht wählbar</span>' : ''}
              </button>`;
          }).join('')}
        </div>
        <p class="hint">${ab.nurFalsche
          ? 'Zur Auswahl stehen alle falschen Antworten seit der letzten Abstimmung.'
          : 'Diesmal lag niemand daneben – stimmt einfach über alle Antworten ab.'}</p>
      </div>`;

    app.querySelectorAll('.vote').forEach(b =>
      b.addEventListener('click', () => stimmeAb(Number(b.dataset.key))));
  }

  function stimmeAb(key) {
    if (S.screen !== 'abstimmung') return;
    const ab = S.abstimmung;
    ab.stimmen[key] = (ab.stimmen[key] || 0) + 1;
    ab.idx++;
    Sound.tick();
    abstimmungZug();
  }

  function abstimmungErgebnis() {
    S.screen = 'abstimmungsergebnis';
    const ab = S.abstimmung;

    const proSpieler = {};
    ab.kandidaten.forEach(k => {
      proSpieler[k.pid] = (proSpieler[k.pid] || 0) + (ab.stimmen[k.key] || 0);
    });
    const gewertet = Object.keys(proSpieler).map(Number)
      .map(pid => ({ p: spielerVon(pid), stimmen: proSpieler[pid] }))
      .sort((a, b) => b.stimmen - a.stimmen);
    const max = gewertet.length ? gewertet[0].stimmen : 0;
    const spitze = gewertet.filter(g => g.stimmen === max);
    const abgegeben = Object.values(ab.stimmen).reduce((a, b) => a + b, 0);

    app.innerHTML = kopf() + `
      <div class="card fade">
        <h2>Das Ergebnis der Abstimmung</h2>
        <p class="hint">${abgegeben} ${abgegeben === 1 ? 'Stimme' : 'Stimmen'} abgegeben.</p>
        <div class="tally">
          ${gewertet.map(g => `
            <div class="tally-row">
              <span class="tally-name">${avatar(g.p)} ${esc(g.p.name)}</span>
              <span class="tally-bar"><i style="width:${max ? (g.stimmen / max) * 100 : 0}%"></i></span>
              <span class="tally-zahl">${g.stimmen}</span>
            </div>`).join('')}
        </div>
        <div class="verdict ${spitze.length === 1 ? 'bad' : ''}">${spitze.length === 1
          ? esc(spitze[0].p.name) + ' hat die dümmste Antwort gegeben.'
          : 'Gleichstand – ' + esc(spitze.map(g => g.p.name).join(' und ')) + ' müssen ins Stechen!'}</div>
        <button class="btn block" id="weiter">${spitze.length === 1
          ? (S.einstellungen.leben > 1 ? 'Das kostet …' : 'Und tschüss!')
          : 'Zum Stechen'}</button>
      </div>`;

    app.querySelector('#weiter').addEventListener('click', () => {
      S.abstimmung = null;
      if (spitze.length === 1) bestrafen(spitze[0].p, nachRauswurf);
      else stechenStarten(spitze.map(g => g.p.id));
    });
  }

  /* ---------------------------------------------------------
     Stechen bei Gleichstand
     --------------------------------------------------------- */
  function stechenStarten(kandidaten) {
    S.stechen = { kandidaten, ergebnisse: {}, reihe: kandidaten.slice(), idx: 0 };
    stechenZug();
  }

  function stechenAuswerten() {
    const st = S.stechen;
    const falsche = st.kandidaten.filter(id => st.ergebnisse[id] === false);

    if (falsche.length === 1) {
      const p = spielerVon(falsche[0]);
      S.stechen = null;
      return bestrafen(p, nachRauswurf);
    }
    if (falsche.length > 1 && falsche.length < st.kandidaten.length) {
      st.kandidaten = falsche;
    }
    // alle richtig oder alle falsch: neue Stechrunde mit denselben Kandidaten
    st.ergebnisse = {};
    st.reihe = st.kandidaten.slice();
    st.idx = 0;

    S.screen = 'stechinfo';
    app.innerHTML = kopf() + `
      <div class="card turn-card fade">
        <span class="emoji" style="font-size:3rem">⚔️</span>
        <h2>Weiter im Stechen!</h2>
        <p class="hint">Noch dabei: ${st.kandidaten.map(id => esc(spielerVon(id).name)).join(', ')}</p>
        <br>
        <button class="btn" id="weiter">Nächste Stechfrage</button>
      </div>`;
    app.querySelector('#weiter').addEventListener('click', stechenZug);
  }

  /* ---------------------------------------------------------
     Rauswurf & Spielende
     --------------------------------------------------------- */
  /* Im Abstimmungsmodus kostet die dümmste Antwort ein Leben – sonst fliegt man sofort */
  function bestrafen(p, weiter) {
    if (S.einstellungen.modus === 'voting') {
      p.leben--;
      if (p.leben > 0) return zeigeLebenVerloren(p, weiter);
    }
    rauswurf(p, weiter);
  }

  function zeigeLebenVerloren(p, weiter) {
    S.screen = 'lebenverloren';
    Sound.falsch();
    const weg = Math.max(0, S.einstellungen.leben - p.leben);

    app.innerHTML = kopf() + `
      <div class="card boom warn">
        <span class="emoji">💔</span>
        <h2>${esc(p.name)} verliert ein Leben</h2>
        <p class="lives-big">${'❤'.repeat(p.leben)}${'🖤'.repeat(weg)}</p>
        <p class="hint">Noch ${p.leben} ${p.leben === 1 ? 'Leben' : 'Leben'} übrig · ${p.richtig} richtig, ${p.falsch} falsch</p>
        <br>
        <button class="btn" id="weiter">Weiter geht’s</button>
      </div>`;
    app.querySelector('#weiter').addEventListener('click', weiter);
  }

  function rauswurf(p, weiter) {
    S.screen = 'rauswurf';
    p.dabei = false;
    S.rausFolge.push(p.id);
    Sound.raus();

    const uebrig = lebende().length;
    app.innerHTML = kopf() + `
      <div class="card boom">
        <span class="emoji">🪂</span>
        <h2>${esc(p.name)} fliegt raus!</h2>
        <p class="hint">${p.richtig} richtig · ${p.falsch} falsch${uebrig > 1 ? ` · noch ${uebrig} Spieler im Rennen` : ''}</p>
        <br>
        <button class="btn" id="weiter">${uebrig === 1 ? 'Endstand ansehen' : (uebrig === 2 ? 'Auf ins Finale!' : 'Weiterspielen')}</button>
      </div>`;
    app.querySelector('#weiter').addEventListener('click', weiter);
  }

  function spielEndeGeprueft() {
    if (lebende().length <= 1) { zeigeEnde(); return true; }
    return false;
  }

  function zeigeEnde() {
    S.screen = 'ende';
    stoppeTimer();
    Sound.sieg();

    const sieger = lebende()[0];
    const rangfolge = (sieger ? [sieger] : []).concat(
      S.rausFolge.slice().reverse().map(id => spielerVon(id))
    );
    const duemmster = S.rausFolge.length ? spielerVon(S.rausFolge[0]) : null;

    app.innerHTML = `
      <div class="card winner fade">
        <span class="crown">👑</span>
        <h2>${sieger ? esc(sieger.name) + ' gewinnt!' : 'Kein Sieger'}</h2>
        <p class="hint">${sieger ? `${sieger.richtig} richtige Antworten · ${sieger.falsch} Fehler` : ''}</p>
        ${duemmster ? `<p class="loser">Titel „Der Dümmste“: <b>${esc(duemmster.name)}</b> – zuerst rausgeflogen. 🫠</p>` : ''}
      </div>

      <div class="card">
        <h3>Endstand</h3>
        <table class="standings">
          <tr><th>Platz</th><th>Spieler</th><th class="num">Richtig</th><th class="num">Falsch</th><th class="num">Quote</th></tr>
          ${rangfolge.map((p, i) => {
            const ges = p.richtig + p.falsch;
            const quote = ges ? Math.round(p.richtig / ges * 100) + ' %' : '–';
            return `<tr class="${i === 0 ? '' : 'out'}">
              <td>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'}</td>
              <td>${avatar(p)} ${esc(p.name)}</td>
              <td class="num">${p.richtig}</td>
              <td class="num">${p.falsch}</td>
              <td class="num">${quote}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>

      <div class="row">
        <button class="btn" id="revanche">Revanche – gleiche Spieler</button>
        <button class="btn ghost" id="neu">Zurück zur Einrichtung</button>
      </div>`;

    app.querySelector('#revanche').addEventListener('click', spielStarten);
    app.querySelector('#neu').addEventListener('click', zeigeSetup);
  }

  /* ---------------------------------------------------------
     Kopfzeile mit Punktestand
     --------------------------------------------------------- */
  function kopf() {
    const e = S.einstellungen;
    const gesamt = S.reihenfolge.length;
    // Auf Zwischenbildschirmen wäre der Fragenzähler nur verwirrend
    const zwischenschirm = ['rauswurf', 'lebenverloren', 'rundenende', 'abstimmungsergebnis', 'stechinfo', 'ende']
      .includes(S.screen);
    const fortschritt = S.stechen
      ? 'Stechen'
      : S.abstimmung
        ? 'Abstimmung'
        : zwischenschirm
          ? ''
          : `Frage ${Math.min(S.rIndex + 1, gesamt)} / ${gesamt}`;
    const block = e.modus === 'voting' && !S.stechen && !S.abstimmung && !zwischenschirm
      ? `Runde ${S.blockRunde} von ${e.abstimmungNach} bis zur Abstimmung`
      : '';
    const zeile = [`<strong>Runde ${S.runde}</strong>`, fortschritt, block].filter(Boolean).join(' · ');

    return `
      <div class="hud">
        <div>${zeile}</div>
        <div>${lebende().length} von ${S.spieler.length} noch dabei
          <button class="btn ghost small" id="abbrechen" style="margin-left:8px">Abbrechen</button>
        </div>
      </div>
      <div class="scorebar">
        ${S.spieler.map(p => {
          const aktiv = S.aktuell && S.aktuell.pid === p.id && ['frage', 'aufloesung', 'uebergabe'].includes(S.screen);
          const zeigtLeben = e.modus === 'leben' || (e.modus === 'voting' && e.leben > 1);
          const leben = zeigtLeben && p.dabei ? `<span class="lives">${'❤'.repeat(Math.max(0, p.leben))}</span>` : '';
          const punkte = e.modus !== 'leben' && p.dabei ? `<span class="lives">${S.rundenPunkte[p.id] || 0}</span>` : '';
          return `<span class="score-pill ${p.dabei ? '' : 'out'} ${aktiv ? 'active' : ''}">
            ${avatar(p)}${esc(p.name)} ${leben}${punkte}
          </span>`;
        }).join('')}
      </div>`;
  }

  /* ---------------------------------------------------------
     Tastatur
     --------------------------------------------------------- */
  document.addEventListener('keydown', ev => {
    if (ev.target && ['INPUT', 'TEXTAREA'].includes(ev.target.tagName)) return;

    if (S.screen === 'frage') {
      const taste = ev.key.toLowerCase();

      if (S.einstellungen.moderator) {
        const feld = app.querySelector('#gesagt');
        const text = feld ? feld.value : '';
        if (taste === 'r') { ev.preventDefault(); return wertung(true, { text }); }
        if (taste === 'f') { ev.preventDefault(); return wertung(false, { text }); }
        if (!S.aktuell.optionenSichtbar) return;
      }

      const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      const i = map[taste];
      if (i !== undefined && i < S.aktuell.antworten.length) {
        ev.preventDefault();
        antworten(i);
      }
      return;
    }
    if (ev.key === ' ' || ev.key === 'Enter') {
      const btn = app.querySelector('#weiter') || app.querySelector('#start');
      if (btn) { ev.preventDefault(); btn.click(); }
    }
  });

  /* Abbrechen-Button (über Delegation, da er in jedem Kopf steckt) */
  app.addEventListener('click', ev => {
    const b = ev.target.closest('#abbrechen');
    if (!b) return;
    if (confirm('Spiel wirklich abbrechen?')) {
      stoppeTimer();
      S.aktuell = null;
      zeigeSetup();
    }
  });

  /* ---------------------------------------------------------
     Los geht's
     --------------------------------------------------------- */
  laden();
  ladeGestellt();
  zeigeSetup();
})();
