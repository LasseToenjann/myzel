/* ============================================================
   MYZEL - state.js
   Spielstand: Anlegen, Speichern, Laden, Migrieren
   ============================================================ */
const SAVE_KEY = 'myzel_save_v1';
const SAVE_VERSION = 1;

let S = null;

const Save = (() => {

  function fresh() {
    return {
      v: SAVE_VERSION,
      name: '',
      pid: '',                            // Kennung in der globalen Rangliste
      biomass: 0,
      lifetime: 0,
      runTotal: 0,
      structs: [0, 0, 0, 0, 0, 0, 0, 0],
      bought: [0, 0, 0, 0, 0, 0, 0, 0],   // gekaufte Menge (bestimmt den Preis)
      nodes: {},
      level: 0,
      sporen: 0,
      sporeLife: 0,
      muts: {},
      sp: 0,
      spLife: 0,
      biomes: [],
      prestiges: 0,
      symResets: 0,
      chall: {},
      activeChall: null,
      ach: [],
      buffs: [],
      autoBuy: [true, true, true, true, true, true, true, true],
      autoPrestigeOn: false,
      autoPrestigeAt: 1e3,
      buyMode: 1,
      runTime: 0,
      playTime: 0,
      idleTime: 0,
      goldTimer: 130,
      lastSave: Date.now(),
      seenTabs: [],
      stats: { clicks: 0, golds: 0, offlineRuns: 0, maxIdle: 0, bestSpores: 0, bestRate: 0, started: Date.now(), fastest: 0 },
      opt: { sound: true, notation: 'kurz', particles: true, offline: true, ticker: true, confirmPrestige: true }
    };
  }

  /** Tiefes Auffüllen fehlender Felder (Migration). */
  function merge(target, src) {
    for (const k in target) {
      if (src[k] === undefined || src[k] === null) continue;
      if (Array.isArray(target[k])) {
        target[k] = src[k].slice();
      } else if (typeof target[k] === 'object') {
        merge(target[k], src[k]);
      } else {
        target[k] = src[k];
      }
    }
    return target;
  }

  function has() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }

  function peek() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return U.decode(raw);
    } catch (e) { return null; }
  }

  function load() {
    const data = peek();
    if (!data) return false;
    S = merge(fresh(), data);
    // Sicherheitsnetz gegen kaputte Werte
    if (!isFinite(S.biomass) || S.biomass < 0) S.biomass = 0;
    if (!isFinite(S.lifetime) || S.lifetime < 0) S.lifetime = 0;
    S.structs = S.structs.map(v => Math.max(0, Math.floor(v || 0)));
    S.bought = S.bought.map((v, i) => Math.max(S.structs[i], Math.floor(v || 0)));
    S.buffs = (S.buffs || []).filter(b => b && D.BUFF_BY_ID[b.id]);
    return true;
  }

  function newGame() {
    S = fresh();
    write();
  }

  function write() {
    if (!S) return false;
    S.lastSave = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, U.encode(S));
      return true;
    } catch (e) {
      console.warn('Speichern fehlgeschlagen', e);
      return false;
    }
  }

  function exportStr() { return U.encode(S); }

  function importStr(str) {
    const data = U.decode(str);
    if (!data || typeof data !== 'object' || data.structs === undefined) return false;
    S = merge(fresh(), data);
    write();
    return true;
  }

  function wipe() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  return { fresh, load, newGame, write, has, peek, exportStr, importStr, wipe };
})();
