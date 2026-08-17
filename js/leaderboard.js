/* ============================================================
   MYZEL - leaderboard.js
   Globale Rangliste über textdb.online - denselben kostenlosen
   Key-Value-Speicher nutzt auch der Wahlwächter.

   Lesen:     GET https://textdb.online/<key>
   Schreiben: GET https://textdb.online/update/?key=<key>&value=<json>

   Es gibt kein Konto und keine Rechte: Wer den Schlüssel kennt, kann
   schreiben. Deshalb steht dort ausschließlich, was auch öffentlich
   sein darf - Anzeigename und Spielstände, sonst nichts.

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

  /* ---------- Speicherformat ----------
     Kurze Feldnamen, weil alle Einträge zusammen in einem Textfeld liegen. */
  const pack = e => ({
    i: e.id, n: e.name, l: e.level, b: e.bio, s: e.sp, p: e.pres, d: e.date,
    t: e.playTime, a: e.ach, k: e.nodes, m: e.biomes, r: e.rate, g: e.golds, c: e.chall
  });
  const unpack = p => ({
    id: p.i, name: p.n, level: p.l || 0, bio: p.b || 0, sp: p.s || 0, pres: p.p || 0,
    date: p.d || 0, playTime: p.t || 0, ach: p.a || 0, nodes: p.k || 0,
    biomes: p.m || 0, rate: p.r || 0, golds: p.g || 0, chall: p.c || 0
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
  async function read() {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(BASE + KEY + '?t=' + Date.now(), { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (!text.trim()) return [];
      const data = JSON.parse(text);
      return Array.isArray(data.scores) ? data.scores.map(unpack) : [];
    } finally { clearTimeout(t); }
  }

  async function write(list) {
    const body = JSON.stringify({ v: 1, scores: list.slice(0, MAX).map(pack) });
    const res = await fetch(BASE + 'update/?key=' + KEY + '&value=' + encodeURIComponent(body));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (j.status !== 1) throw new Error('Schreiben abgelehnt');
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
      golds: S.stats.golds,
      chall: E.challTierSum()
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

  /* ---------- automatisch senden ----------
     Der Eintrag soll von allein aktuell bleiben. Gesendet wird aber nur,
     wenn sich auch etwas geändert hat, und höchstens alle 90 Sekunden -
     sonst entstünde bei jedem Tick ein Netzzugriff. */
  let letzterStand = '', letzterZeitpunkt = 0, laeuft = false;

  function autoSubmit() {
    if (!S || !S.name || !S.opt.autoBoard) return;
    if (laeuft || Date.now() - letzterZeitpunkt < AUTO_MS) return;
    const stand = S.level + '|' + Math.round(Math.log10(S.lifetime + 1) * 100) + '|' + S.spLife;
    if (stand === letzterStand) return;
    laeuft = true;
    letzterZeitpunkt = Date.now();
    submit(1).then(r => { if (r.ok) letzterStand = stand; })
      .catch(() => {})
      .then(() => { laeuft = false; });
  }

  /** Nach einem Namenswechsel soll sofort wieder gesendet werden dürfen. */
  function resetAuto() { letzterStand = ''; letzterZeitpunkt = 0; }

  return { fetchList, submit, autoSubmit, resetAuto, myEntry, playerId, MAX };
})();
