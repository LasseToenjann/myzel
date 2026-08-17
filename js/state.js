/* ============================================================
   MYZEL - state.js
   Spielstand: Anlegen, Speichern, Laden, Migrieren
   ============================================================ */
const SAVE_KEY = 'myzel_save_v1';       // alter Einzelspielstand (wird übernommen)
const SLOT_KEY = 'myzel_platz_';        // myzel_platz_1 .. myzel_platz_3
const SLOT_COUNT = 3;
const LAST_SLOT_KEY = 'myzel_letzter_platz';
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
      sporenGesamt: 0,    // Sporen ueber alle Symbiosen - sinkt nie
      muts: {},
      sp: 0,
      spLife: 0,
      biomes: [],
      prestiges: 0,
      symResets: 0,
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
      rateVorReset: 0,      // Produktion vor dem letzten Sporenflug (Aufbau-Anzeige)
      reifeBonus: 0,        // erarbeitete Reifung aus zeitlich begrenzten Buffs
      lastSave: Date.now(),
      lastSeen: Date.now(),
      seenTabs: [],
      seenTips: [],
      stats: { clicks: 0, golds: 0, offlineRuns: 0, maxIdle: 0, bestSpores: 0, bestRate: 0, started: Date.now(), fastest: 0 },
      opt: { sound: true, notation: 'kurz', particles: true, offline: true, ticker: true,
        confirmPrestige: true, autoBoard: true, music: false, musicVol: 0.5, sfxVol: 0.6 }
    };
  }

  /** Tiefes Auffüllen fehlender Felder (Migration).

      Achtung bei freien Tabellen: nodes und muts haben in fresh() keine
      festen Schlüssel. Ein "for (const k in target)" läuft dort ins Leere
      und würde den gesamten Skillbaum verwerfen - genau das ist passiert.
      Solche Tabellen werden deshalb vollständig übernommen. */
  function merge(target, src) {
    for (const k in target) {
      const q = src[k];
      if (q === undefined || q === null) continue;
      if (Array.isArray(target[k])) {
        if (Array.isArray(q)) target[k] = q.slice();
      } else if (target[k] && typeof target[k] === 'object') {
        if (typeof q !== 'object') continue;
        if (Object.keys(target[k]).length === 0) {
          target[k] = Object.assign({}, q);      // freie Tabelle: ganz übernehmen
        } else {
          merge(target[k], q);                    // festes Feld: einzeln auffüllen
        }
      } else {
        target[k] = q;
      }
    }
    return target;
  }

  /** Nur Zahlen >= 0 durchlassen - schützt Skillbaum und Mutationen vor
      kaputten Werten aus einer alten oder verfälschten Sicherung. */
  function saubereTabelle(tab, erlaubt) {
    const raus = {};
    for (const k in tab) {
      if (erlaubt && !erlaubt[k]) continue;
      const v = Math.floor(Number(tab[k]));
      if (isFinite(v) && v > 0) raus[k] = v;
    }
    return raus;
  }

  /* ---------- Plätze ----------
     Drei Plätze nebeneinander. Der alte Einzelspielstand wandert beim
     ersten Start auf Platz 1, damit niemand seinen Fortschritt verliert. */
  let aktiv = 1;

  function slotKey(i) { return SLOT_KEY + i; }

  function migriere() {
    try {
      const alt = localStorage.getItem(SAVE_KEY);
      if (alt && !localStorage.getItem(slotKey(1))) {
        localStorage.setItem(slotKey(1), alt);
        localStorage.removeItem(SAVE_KEY);
      }
    } catch (e) {}
  }

  /** Kurzinfo zu jedem Platz für die Auswahl auf dem Startbildschirm. */
  function slots() {
    migriere();
    const list = [];
    for (let i = 1; i <= SLOT_COUNT; i++) {
      let d = null;
      try { const raw = localStorage.getItem(slotKey(i)); if (raw) d = U.decode(raw); } catch (e) {}
      list.push(d ? {
        nr: i, leer: false, name: d.name || 'Namenloses Myzel',
        level: d.level || 0, lifetime: d.lifetime || 0,
        playTime: d.playTime || 0, lastSave: d.lastSave || 0,
        prestiges: d.prestiges || 0, biomes: (d.biomes || []).length
      } : { nr: i, leer: true });
    }
    return list;
  }

  function setzeAktiv(i) { aktiv = i; try { localStorage.setItem(LAST_SLOT_KEY, String(i)); } catch (e) {} }
  function letzterPlatz() {
    try { return parseInt(localStorage.getItem(LAST_SLOT_KEY), 10) || 1; } catch (e) { return 1; }
  }

  function has() { migriere(); return slots().some(s2 => !s2.leer); }

  function peek(i) {
    try {
      const raw = localStorage.getItem(slotKey(i || aktiv));
      if (!raw) return null;
      return U.decode(raw);
    } catch (e) { return null; }
  }

  function load(i) {
    if (i) setzeAktiv(i);
    const data = peek(aktiv);
    if (!data) return false;
    S = merge(fresh(), data);
    pruefe();
    return true;
  }

  /** Sicherheitsnetz gegen kaputte Werte - nach jedem Laden und Import. */
  function pruefe() {
    if (!isFinite(S.biomass) || S.biomass < 0) S.biomass = 0;
    if (!isFinite(S.lifetime) || S.lifetime < 0) S.lifetime = 0;
    S.structs = S.structs.map(v => Math.max(0, Math.floor(v || 0)));
    S.bought = S.bought.map((v, i) => Math.max(S.structs[i], Math.floor(v || 0)));
    S.buffs = (S.buffs || []).filter(b => b && D.BUFF_BY_ID[b.id]);
    S.nodes = saubereTabelle(S.nodes, D.NODE_BY_ID);
    S.muts = saubereTabelle(S.muts, D.MUT_BY_ID);
    if (!S.lastSeen) S.lastSeen = S.lastSave || Date.now();

    /* Den Gesamtzaehler gab es frueher nicht. Sicher ist mindestens der
       aktuelle Bestand; was vor einer Symbiose gesammelt wurde, laesst sich
       nicht mehr rekonstruieren - es stand nirgends. */
    if ((S.sporenGesamt || 0) < S.sporeLife) S.sporenGesamt = S.sporeLife;

    /* Spielstände von vor der Aufbau-Anzeige kennen rateVorReset nicht. Wer
       zuletzt davor geflogen ist, steckt womöglich gerade im Wiederaufbau -
       ohne Bezugswert bliebe die Anzeige stumm. Einmalig aus der besten
       bisherigen Produktion nachtragen. Steht dort ein Wert, der nur mit
       einer goldenen Spore erreicht wurde, ist er etwas zu hoch; spätestens
       der nächste Sporenflug setzt ihn wieder gerade. */
    const hatteReset = (S.prestiges || 0) > 0 || (S.symResets || 0) > 0;
    if (!S.rateVorReset && hatteReset) S.rateVorReset = S.stats.bestRate || 0;
  }

  function newGame(name, i) {
    if (i) setzeAktiv(i);
    S = fresh();
    S.name = (name || '').trim().slice(0, 22);
    write();
  }

  /** Schreibt Daten in einen bestimmten Platz, ohne ihn zu laden. */
  function schreibePlatz(i, daten) {
    try { localStorage.setItem(slotKey(i), U.encode(daten)); return true; } catch (e) { return false; }
  }

  function loesche(i) {
    try { localStorage.removeItem(slotKey(i)); } catch (e) {}
  }

  function write() {
    if (!S) return false;
    S.lastSave = Date.now();
    S.lastSeen = Date.now();
    try {
      localStorage.setItem(slotKey(aktiv), U.encode(S));
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
    pruefe();
    write();
    return true;
  }

  function wipe() { loesche(aktiv); }

  return { fresh, load, newGame, write, has, peek, exportStr, importStr, wipe,
    slots, loesche, schreibePlatz, setzeAktiv, letzterPlatz, get aktiv() { return aktiv; }, SLOT_COUNT };
})();
