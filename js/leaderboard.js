/* ============================================================
   MYZEL - leaderboard.js
   Globale Rangliste über textdb.online - denselben kostenlosen
   Key-Value-Speicher nutzt auch der Wahlwächter.

   Lesen:     GET https://textdb.online/<key>
   Schreiben: GET https://textdb.online/update/?key=<key>&value=<json>

   Es gibt kein Konto und keine Rechte: Wer den Schlüssel kennt, kann
   schreiben. Deshalb steht dort ausschließlich, was auch öffentlich
   sein darf - Anzeigename und Spielstände, sonst nichts.

   ACHTUNG, teuer erkauft: Der Dienst dekodiert den Wert ZWEIMAL und macht
   dabei im zweiten Durchgang aus jedem "+" ein Leerzeichen. Aus 1e+27
   wurde so 1e 27, und das gespeicherte JSON war unlesbar. Deshalb darf
   der Datensatz weder "+" noch "%" enthalten - dafuer sorgt sauber().

   Fällt der Dienst aus, greift automatisch die lokale Liste, damit
   das Spiel nie auf eine Antwort warten muss.
   ============================================================ */
const LB = (() => {

  const BASE = 'https://textdb.online/';
  const KEY = 'myzel_rangliste_q4v8n2';
  const LOCAL_KEY = 'myzel_board_v1';
  const MAX = 50;
  const TIMEOUT_MS = 8000;
  const AUTO_MS = 90000;          // frühestens alle 90 s von selbst senden
  const HERZ_MS = 300000;         // spätestens alle 5 min, auch ohne Änderung

  /* ---------- Speicherformat ----------
     Kurze Feldnamen, weil alle Einträge zusammen in einem Textfeld liegen. */

  /** Sechs geltende Stellen genügen für die Anzeige und halten die Adresse
      kurz - der ganze Datensatz reist als Query-Parameter. */
  function zahl(x) {
    const v = Number(x);
    if (!isFinite(v) || v <= 0) return 0;
    return Number(v.toPrecision(6));
  }

  /** Namen ohne die beiden Zeichen, die der Dienst verschluckt. */
  function reinerName(n) {
    return String(n || '').replace(/[%+]/g, '').replace(/\s+/g, ' ').trim().slice(0, 22)
      || 'Namenloses Myzel';
  }

  const pack = e => ({
    i: e.id, n: reinerName(e.name), l: Math.floor(e.level) || 0, b: zahl(e.bio),
    s: Math.floor(e.sp) || 0, p: Math.floor(e.pres) || 0, d: Math.floor(e.date) || 0,
    t: Math.floor(e.playTime) || 0, a: Math.floor(e.ach) || 0, k: Math.floor(e.nodes) || 0,
    m: Math.floor(e.biomes) || 0, r: zahl(e.rate), g: Math.floor(e.golds) || 0
  });
  const unpack = p => ({
    id: p.i, name: p.n, level: p.l || 0, bio: p.b || 0, sp: p.s || 0, pres: p.p || 0,
    date: p.d || 0, playTime: p.t || 0, ach: p.a || 0, nodes: p.k || 0,
    biomes: p.m || 0, rate: p.r || 0, golds: p.g || 0
  });

  /** Reifegrad zählt zuerst, bei Gleichstand die gesamte Biomasse. */
  const sortList = list => list.sort((a, b) => (b.level - a.level) || (b.bio - a.bio));

  /* ---------- lokale Sicherung ---------- */
  function localList() {
    try { return (JSON.parse(localStorage.getItem(LOCAL_KEY)) || []).map(unpack); } catch (e) { return []; }
  }
  function localSave(list) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, MAX).map(pack))); } catch (e) {}
  }

  /* ---------- textdb ---------- */
  /** Liest die Liste und repariert dabei den Schaden aus alten Fassungen:
      "1e 27" wird wieder zu "1e+27". Ohne das bleibt die ganze Liste
      unlesbar, sobald ein einziger Eintrag betroffen ist. */
  function lesbar(text) {
    try { return JSON.parse(text); } catch (e) {}
    try { return JSON.parse(text.replace(/e (-?\d)/g, 'e+$1')); } catch (e) {}
    return null;
  }

  async function read() {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(BASE + KEY + '?t=' + Date.now(), { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (!text.trim()) return [];
      const data = lesbar(text);
      if (!data) throw new Error('Liste unlesbar');
      return Array.isArray(data.scores) ? data.scores.map(unpack) : [];
    } finally { clearTimeout(t); }
  }

  /** Baut den Datensatz so, dass ihn der Dienst unveraendert zurueckgibt:
      JSON.stringify schreibt grosse Zahlen als 1e+27 - das "+" wird beim
      Dekodieren zum Leerzeichen. Ohne Vorzeichen (1e27) ist es weiterhin
      gueltiges JSON und uebersteht den Weg unbeschadet. */
  function baueWert(list) {
    return JSON.stringify({ v: 1, scores: list.slice(0, MAX).map(pack) }).replace(/e\+/g, 'e');
  }

  async function write(list) {
    const body = baueWert(list);
    if (/[%+]/.test(body)) throw new Error('Datensatz enthält verbotene Zeichen');
    const url = BASE + 'update/?key=' + KEY + '&value=' + encodeURIComponent(body);
    if (url.length > 7500) throw new Error('Datensatz zu lang');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      if (j.status !== 1) throw new Error('Schreiben abgelehnt');
    } finally { clearTimeout(t); }
  }

  /* ---------- öffentliche Schnittstelle ---------- */

  /** Dauerhafte Kennung je Spielstand. Ohne sie legte jedes Senden einen
      neuen Eintrag an, statt den eigenen zu aktualisieren. */
  function playerId() {
    if (!S.pid) S.pid = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    return S.pid;
  }

  function myEntry() {
    return {
      id: playerId(),
      name: (S.name || 'Namenloses Myzel').slice(0, 22),
      level: S.level,
      bio: S.lifetime,
      sp: S.spLife,
      pres: S.prestiges,
      date: Date.now(),
      playTime: Math.round(S.playTime),
      ach: S.ach.length,
      nodes: E.nodeLevelSum(),
      biomes: S.biomes.length,
      rate: Math.round(S.stats.bestRate),
      golds: S.stats.golds
    };
  }

  /** Liste holen. Bei Netzproblemen die zuletzt gesehene Liste. */
  async function fetchList() {
    try {
      const list = sortList(await read());
      localSave(list);
      return { list, online: true };
    } catch (e) {
      console.warn('Rangliste nicht erreichbar', e);
      return { list: sortList(localList()), online: false };
    }
  }

  /** Ergebnis eintragen. Mehrere Versuche, weil sich gleichzeitige
      Schreibzugriffe sonst gegenseitig überschreiben könnten. */
  async function submit(versuche) {
    const me = myEntry();
    for (let versuch = 0; versuch < (versuche || 3); versuch++) {
      try {
        const list = sortList(await read());
        const idx = list.findIndex(e => e.id === me.id);
        if (idx >= 0) list[idx] = me; else list.push(me);
        const sortiert = sortList(list).slice(0, MAX);
        localSave(sortiert);
        if (!sortiert.some(e => e.id === me.id)) {
          return { ok: true, list: sortiert, me, inListe: false };   // zu wenig für die Liste
        }
        await write(sortiert);
        const geprueft = sortList(await read());
        if (geprueft.some(e => e.id === me.id && e.level === me.level)) {
          return { ok: true, list: geprueft, me, inListe: true };
        }
      } catch (e) { /* nächster Versuch */ }
      await new Promise(r => setTimeout(r, 400 + Math.random() * 1400));
    }
    const ersatz = sortList(localList());
    return { ok: false, list: ersatz, me, inListe: ersatz.some(e => e.id === me.id) };
  }

  /** Benennt einen Eintrag in der Rangliste um - anhand der festen Kennung.
      Ohne das hiesse ein umbenannter Spielstand dort weiter beim alten Namen. */
  async function umbenennen(pid, name) {
    if (!pid) return false;
    for (let versuch = 0; versuch < 2; versuch++) {
      try {
        const list = sortList(await read());
        const idx = list.findIndex(e => e.id === pid);
        if (idx < 0) return true;                 // steht noch gar nicht drin
        list[idx].name = String(name).slice(0, 22);
        await write(list);
        localSave(list);
        return true;
      } catch (e) { /* nächster Versuch */ }
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  }

  /* ---------- automatisch senden ----------
     Der Eintrag soll von allein aktuell bleiben. Gesendet wird aber nur,
     wenn sich auch etwas geändert hat, und höchstens alle 90 Sekunden -
     sonst entstünde bei jedem Tick ein Netzzugriff. */
  let letzterStand = '', letzterZeitpunkt = 0, laeuft = false;

  /* Fingerabdruck des eigenen Eintrags. Frueher steckten hier nur Reifegrad,
     Groessenordnung der Biomasse und Symbiose-Punkte darin - und genau die
     bewegen sich nach einem Sporenflug ueber Stunden nicht. Der Eintrag blieb
     dann stehen, obwohl laufend gespielt wurde. Jetzt zaehlt alles mit, was
     im Eintrag auch angezeigt wird. */
  function fingerabdruck() {
    const e = myEntry();
    return [
      e.level, Math.round(Math.log10(e.bio + 1) * 1000), e.sp, e.pres,
      e.ach, e.nodes, e.biomes, e.golds, Math.round(Math.log10(e.rate + 1) * 100)
    ].join('|');
  }
  let zustand = { stand: 'neu', zuletzt: 0, drin: false, rang: 0 };

  /** Wie es um den eigenen Eintrag steht - die Statistik zeigt es an.
      Vorher blieb ein Fehlschlag unsichtbar, und es sah so aus, als
      würde die Bestenliste einen einfach nicht aufnehmen.
      Die Einstellung wird direkt gelesen, damit die Anzeige nicht bis
      zum naechsten Versand auf einem alten Stand haengen bleibt. */
  function status() {
    if (S && S.opt && !S.opt.autoBoard) return { stand: 'aus', zuletzt: 0, drin: false, rang: 0 };
    if (zustand.stand === 'aus') return { stand: 'neu', zuletzt: 0, drin: false, rang: 0 };
    return zustand;
  }

  function merkeErgebnis(r) {
    if (r && r.ok) {
      const i = r.list.findIndex(e => e.id === r.me.id);
      zustand = { stand: 'ok', zuletzt: Date.now(), drin: i >= 0, rang: i + 1 };
    } else {
      zustand = { stand: 'fehler', zuletzt: zustand.zuletzt, drin: zustand.drin, rang: zustand.rang };
    }
    return r;
  }

  function autoSubmit(sofort) {
    if (!S || !S.name) return Promise.resolve(null);
    if (!S.opt.autoBoard) return Promise.resolve(null);
    if (laeuft) return Promise.resolve(null);
    const abstand = Date.now() - letzterZeitpunkt;
    if (!sofort && abstand < AUTO_MS) return Promise.resolve(null);
    const stand = fingerabdruck();
    // Entweder hat sich etwas geaendert, oder der Herzschlag ist faellig.
    if (!sofort && stand === letzterStand && abstand < HERZ_MS) return Promise.resolve(null);
    laeuft = true;
    letzterZeitpunkt = Date.now();
    return submit(2)
      .then(r => { if (r.ok) letzterStand = stand; return merkeErgebnis(r); })
      .catch(() => merkeErgebnis(null))
      .then(r => { laeuft = false; return r; });
  }

  /** Nach einem Namenswechsel soll sofort wieder gesendet werden dürfen. */
  function resetAuto() { letzterStand = ''; letzterZeitpunkt = 0; }

  return { fetchList, submit, autoSubmit, resetAuto, umbenennen, myEntry, playerId, status,
    MAX, AUTO_MS, HERZ_MS };
})();
