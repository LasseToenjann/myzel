/* ============================================================
   MYZEL - leaderboard.js
   Bestenliste. Läuft ohne Server rein lokal.
   Für eine globale Liste: URL unten eintragen (z. B. textdb.online).
   Das Spiel funktioniert vollständig ohne diese Einstellung.
   ============================================================ */
const LB = (() => {

  // ---- Konfiguration -------------------------------------------------
  // Leer lassen = nur lokale Bestenliste (keine Netzwerkzugriffe).
  // Beispiel: 'https://textdb.online/EIN-LANGER-EIGENER-SCHLUESSEL/'
  const REMOTE_URL = '';
  // --------------------------------------------------------------------

  const LOCAL_KEY = 'myzel_scores_v1';
  const isRemote = () => !!REMOTE_URL;

  function localList() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch (e) { return []; }
  }
  function localSave(list) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 100))); } catch (e) {}
  }

  function entryFromState() {
    return {
      n: (S.name || 'Namenloses Myzel').slice(0, 22),
      lv: S.level,
      bio: S.lifetime,
      sp: S.spLife,
      pres: S.prestiges,
      t: Date.now()
    };
  }

  function sortList(list) {
    return list.sort((a, b) => (b.lv - a.lv) || (b.bio - a.bio));
  }

  /** Liste holen (lokal oder remote). */
  async function fetchList() {
    if (!isRemote()) return sortList(localList());
    try {
      const r = await fetch(REMOTE_URL, { cache: 'no-store' });
      const txt = (await r.text()).trim();
      const list = txt ? JSON.parse(txt) : [];
      return sortList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Bestenliste nicht erreichbar', e);
      return sortList(localList());
    }
  }

  /** Eintrag senden. Ersetzt einen früheren Eintrag mit gleichem Namen. */
  async function submit() {
    const me = entryFromState();
    let list = await fetchList();
    list = list.filter(e => e.n !== me.n);
    list.push(me);
    list = sortList(list).slice(0, 100);
    localSave(list);
    if (isRemote()) {
      try {
        await fetch(REMOTE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'value=' + encodeURIComponent(JSON.stringify(list))
        });
      } catch (e) {
        console.warn('Senden fehlgeschlagen', e);
        return { ok: false, list, me };
      }
    }
    return { ok: true, list, me };
  }

  return { fetchList, submit, isRemote, entryFromState };
})();
