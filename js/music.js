/* ============================================================
   MYZEL - music.js
   Ruhiger Klangteppich, live erzeugt statt aus einer Datei.

   Warum erzeugt: Das Spiel kommt ohne Abhängigkeiten und ohne große
   Dateien aus. Eine Aufnahme wären mehrere Megabyte, die bei jedem
   Aufruf geladen werden müssten - und sie würde sich nach ein paar
   Minuten wiederholen. Hier läuft stattdessen eine Akkordfolge mit
   einzelnen Tropfen darüber, die sich nie exakt wiederholt.

   Tonvorrat: C-Dur-Pentatonik. Keine Halbtonschritte, dadurch klingt
   nichts spannungsgeladen - aber dur-gefärbt und hell liegend, damit es
   nicht schwermütig wird.
   ============================================================ */
const Music = (() => {

  let ctx = null, master = null, filter = null, delay = null, fb = null, wet = null;
  let laeuft = false, akkordTimer = null, tropfenTimer = null;
  const stimmen = [];

  /* Grundtöne der Akkordfolge (Hz). Sechs Stufen, die ineinander übergehen.
     Dur-gefärbt und eine Oktave höher als in der ersten Fassung — die klang
     zu dunkel und zu schwer für ein Spiel, das leicht sein soll. */
  const AKKORDE = [
    [130.81, 196.00, 261.63],   // C
    [196.00, 293.66, 392.00],   // G
    [174.61, 261.63, 349.23],   // F
    [220.00, 329.63, 440.00],   // Am
    [164.81, 246.94, 329.63],   // Em
    [174.61, 220.00, 349.23]    // F mit Terz
  ];
  /* Tropfentöne: C-Dur-Pentatonik, hell liegend */
  const TROPFEN = [523.25, 587.33, 659.25, 783.99, 880.00,
                   1046.50, 1174.66, 1318.51, 1567.98];

  let akkordIdx = 0;

  function aufbauen() {
    if (ctx) return true;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return false; }

    master = ctx.createGain();
    master.gain.value = 0;

    // weiches Tiefpassfilter - nimmt den Obertönen die Schärfe
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.6;

    // sehr langsame Bewegung im Filter, damit der Klang nicht steht
    const lfo = ctx.createOscillator();
    const lfoTiefe = ctx.createGain();
    lfo.frequency.value = 0.07;         // eine Bewegung je 14 Sekunden
    lfoTiefe.gain.value = 420;
    lfo.connect(lfoTiefe); lfoTiefe.connect(filter.frequency);
    lfo.start();

    // kurzes Echo als Ersatz für einen Hall
    delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.33;
    fb = ctx.createGain(); fb.gain.value = 0.34;
    wet = ctx.createGain(); wet.gain.value = 0.3;
    delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(master);

    filter.connect(master);
    filter.connect(delay);
    master.connect(ctx.destination);
    return true;
  }

  /** Eine Dauerstimme: zwei leicht verstimmte Schwingungen klingen voller. */
  function stimme(freq) {
    const g = ctx.createGain();
    g.gain.value = 0;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'triangle'; o2.type = 'sine';
    o1.frequency.value = freq;
    o2.frequency.value = freq * 1.004;    // Schwebung
    o1.connect(g); o2.connect(g); g.connect(filter);
    o1.start(); o2.start();
    return { g, o1, o2 };
  }

  /** Wechselt weich auf den nächsten Akkord. */
  function akkordWechsel() {
    if (!laeuft) return;
    const t = ctx.currentTime;
    const akk = AKKORDE[akkordIdx % AKKORDE.length];
    akkordIdx++;
    stimmen.forEach((st, i) => {
      const ziel = akk[i] || akk[0];
      st.o1.frequency.setTargetAtTime(ziel, t, 1.6);
      st.o2.frequency.setTargetAtTime(ziel * 1.004, t, 1.6);
      st.g.gain.setTargetAtTime(0.05, t, 1.8);
    });
    akkordTimer = setTimeout(akkordWechsel, 7500 + Math.random() * 4500);
  }

  /** Einzelne Töne, die über dem Teppich liegen. */
  function tropfen() {
    if (!laeuft) return;
    const t = ctx.currentTime;
    const f = TROPFEN[Math.floor(Math.random() * TROPFEN.length)];
    const o = ctx.createOscillator(), g = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g);
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; g.connect(pan); pan.connect(delay); pan.connect(filter); }
    else { g.connect(delay); g.connect(filter); }
    o.start(t); o.stop(t + 2.6);
    tropfenTimer = setTimeout(tropfen, 1800 + Math.random() * 3000);
  }

  /* ---------- Steuerung ---------- */

  function start() {
    if (laeuft || !S || !S.opt.music) return;
    if (!aufbauen()) return;
    if (ctx.state === 'suspended') ctx.resume();
    laeuft = true;
    if (!stimmen.length) {
      AKKORDE[0].forEach(f => stimmen.push(stimme(f)));
    }
    akkordIdx = 0;
    akkordWechsel();
    tropfenTimer = setTimeout(tropfen, 1400);
    lautstaerke(S.opt.musicVol);
  }

  function stop() {
    if (!laeuft) return;
    laeuft = false;
    clearTimeout(akkordTimer); clearTimeout(tropfenTimer);
    if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
    stimmen.forEach(st => st.g.gain.setTargetAtTime(0, ctx.currentTime, 0.6));
  }

  /** 0 bis 1. Quadriert, weil Lautstärke so gleichmäßiger wirkt. */
  function lautstaerke(v) {
    if (!master) return;
    const ziel = Math.pow(U.clamp(v === undefined ? 0.5 : v, 0, 1), 2) * 0.9;
    master.gain.setTargetAtTime(laeuft ? ziel : 0, ctx.currentTime, 0.3);
  }

  function umschalten() {
    S.opt.music = !S.opt.music;
    if (S.opt.music) start(); else stop();
    return S.opt.music;
  }

  return { start, stop, lautstaerke, umschalten, get laeuft() { return laeuft; } };
})();
