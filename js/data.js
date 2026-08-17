/* ============================================================
   MYZEL - data.js
   Alle Inhalte: Strukturen, Skillbaum, Mutationen, Biome,
   Prüfungen, Erfolge, Ticker-Texte
   ============================================================ */
const D = (() => {

  /* ================= STRUKTUREN ================= */
  const STRUCTS = [
    { id: 0, name: 'Hyphe', ic: '🌱', col: '#7ee081', cost: 15, mul: 1.13, prod: 0.15, unlock: 0,
      desc: 'Der erste Faden im Dunkeln.' },
    { id: 1, name: 'Rhizomorph', ic: '🪢', col: '#a6e85c', cost: 400, mul: 1.15, prod: 2.6, unlock: 200,
      desc: 'Gebündelte Stränge transportieren Nährstoffe weit.' },
    { id: 2, name: 'Knotenpunkt', ic: '⬢', col: '#5bd4f5', cost: 12e3, mul: 1.17, prod: 36, unlock: 6e3,
      desc: 'Kreuzungen, an denen sich das Netz verdichtet.' },
    { id: 3, name: 'Fruchtkörper', ic: '🍄', col: '#f5a65b', cost: 5e5, mul: 1.19, prod: 520, unlock: 2.5e5,
      desc: 'Was der Wanderer über der Erde sieht.' },
    { id: 4, name: 'Sporenlager', ic: '✺', col: '#f7c948', cost: 3e7, mul: 1.21, prod: 9.5e3, unlock: 1.5e7,
      desc: 'Kammern voller schlafender Möglichkeiten.' },
    { id: 5, name: 'Symbiosewurzel', ic: '🌳', col: '#b98bf0', cost: 1e10, mul: 1.23, prod: 3.2e5, unlock: 5e9,
      desc: 'Ein Pakt mit den Bäumen: Zucker gegen Wasser.' },
    { id: 6, name: 'Mykorrhiza-Netz', ic: '❋', col: '#4fe0c8', cost: 5e13, mul: 1.25, prod: 2.4e7, unlock: 2e13,
      desc: 'Das Wood Wide Web. Der ganze Wald spricht durch dich.' },
    { id: 7, name: 'Weltmyzel', ic: '🜨', col: '#ff8fb1', cost: 4e17, mul: 1.28, prod: 4e9, unlock: 1e17,
      desc: 'Ein einziger Organismus, größer als jeder Wald.', needNode: 't_welt' }
  ];

  const MILESTONE_STEP = 25;   // alle 25 Stück -> x2

  /* ================= SKILLBAUM ================= */
  const BRANCHES = {
    wachstum:   { name: 'Wachstum',       col: '#7ee081', ang: -90,  ic: '🌿' },
    effizienz:  { name: 'Effizienz',      col: '#5bd4f5', ang: -30,  ic: '⚙' },
    symbiose:   { name: 'Symbiose',       col: '#b98bf0', ang: 30,   ic: '⚭' },
    tiefe:      { name: 'Tiefe',          col: '#4fe0c8', ang: 90,   ic: '◈' },
    automatik:  { name: 'Automatik',      col: '#f5a65b', ang: 150,  ic: '⟳' },
    zersetzung: { name: 'Zersetzung',     col: '#d0a06a', ang: 210,  ic: '☾' }
  };

  // n(id, ring, slot, icon, name, maxLevel, costBase, costGrow, descFn, applyFn, opts)
  const N = (id, b, ring, slot, ic, name, max, cb, cg, d, f, opts) =>
    Object.assign({ id, b, ring, slot, ic, name, max, cb, cg, d, f }, opts || {});

  const NODES = [
    /* ---------- WACHSTUM ---------- */
    N('w_dichte', 'wachstum', 1, 0, '🌱', 'Dichte Hyphen', 10, 1, 1.42,
      lv => `Hyphen produzieren ${U.fmtPct(0.18 * lv)} mehr.`,
      (m, lv) => { m.struct[0] *= 1 + 0.18 * lv; }),
    N('w_ver', 'wachstum', 2, 0, '🪢', 'Verzweigung', 10, 2, 1.42,
      lv => `Rhizomorphen produzieren ${U.fmtPct(0.20 * lv)} mehr.`,
      (m, lv) => { m.struct[1] *= 1 + 0.20 * lv; }),
    N('w_druck', 'wachstum', 3, 0, '💧', 'Nährstoffdruck', 12, 3, 1.40,
      lv => `Gesamte Produktion ${U.fmtPct(0.06 * lv)}.`,
      (m, lv) => { m.global *= 1 + 0.06 * lv; }),
    N('w_knoten', 'wachstum', 4, -1, '⬢', 'Knotenpunkte', 10, 4, 1.42,
      lv => `Knotenpunkte produzieren ${U.fmtPct(0.22 * lv)} mehr.`,
      (m, lv) => { m.struct[2] *= 1 + 0.22 * lv; }),
    N('w_frucht', 'wachstum', 4, 1, '🍄', 'Fruchtreife', 10, 5, 1.42,
      lv => `Fruchtkörper produzieren ${U.fmtPct(0.25 * lv)} mehr.`,
      (m, lv) => { m.struct[3] *= 1 + 0.25 * lv; }, { req: 'w_druck' }),
    N('w_boden', 'wachstum', 5, 0, '🟤', 'Tiefer Boden', 12, 8, 1.40,
      lv => `Gesamte Produktion ${U.fmtPct(0.08 * lv)}.`,
      (m, lv) => { m.global *= 1 + 0.08 * lv; }, { req: 'w_knoten' }),
    N('w_lager', 'wachstum', 6, 0, '✺', 'Sporendruck', 10, 11, 1.42,
      lv => `Sporenlager produzieren ${U.fmtPct(0.28 * lv)} mehr.`,
      (m, lv) => { m.struct[4] *= 1 + 0.28 * lv; }),
    N('w_leben', 'wachstum', 7, 0, '🌾', 'Lebendige Erde', 10, 15, 1.38,
      lv => `Alle Strukturen produzieren ${U.fmtPct(0.075 * lv)} mehr.`,
      (m, lv) => { for (let i = 0; i < 8; i++) m.struct[i] *= 1 + 0.075 * lv; }),
    N('w_wurzel', 'wachstum', 8, 0, '🌳', 'Wurzelkraft', 10, 19, 1.42,
      lv => `Symbiosewurzeln produzieren ${U.fmtPct(0.30 * lv)} mehr.`,
      (m, lv) => { m.struct[5] *= 1 + 0.30 * lv; }),
    N('w_myk', 'wachstum', 9, 0, '❋', 'Mykorrhiza-Kraft', 10, 25, 1.42,
      lv => `Mykorrhiza-Netze produzieren ${U.fmtPct(0.35 * lv)} mehr.`,
      (m, lv) => { m.struct[6] *= 1 + 0.35 * lv; }),
    N('w_welt', 'wachstum', 10, 0, '🜨', 'Weltwuchs', 10, 33, 1.44,
      lv => `Weltmyzel produziert ${U.fmtPct(0.40 * lv)} mehr.`,
      (m, lv) => { m.struct[7] *= 1 + 0.40 * lv; }),
    N('w_ewig', 'wachstum', 11, 0, '♾', 'Ewiges Wachstum', 10, 46, 1.50,
      lv => `Gesamte Produktion ×${U.fmt(Math.pow(1.4, lv))} (×1,40 pro Stufe).`,
      (m, lv) => { m.global *= Math.pow(1.4, lv); }, { sym: 1 }),

    /* ---------- EFFIZIENZ ---------- */
    N('e_spar', 'effizienz', 1, 0, '🔹', 'Sparsame Zellen', 10, 1, 1.40,
      lv => `Alle Strukturen kosten ${U.fmtPct(-(1 - Math.pow(0.96, lv)))} weniger.`,
      (m, lv) => { for (let i = 0; i < 8; i++) m.cost[i] *= Math.pow(0.96, lv); }),
    N('e_kompakt', 'effizienz', 2, 0, '📐', 'Kompakter Bau', 10, 3, 1.45,
      lv => `Kostenwachstum aller Strukturen −${(0.0025 * lv).toFixed(4)} (Untergrenze 1,10).`,
      (m, lv) => { m.costScale += 0.0025 * lv; }),
    N('e_bulk10', 'effizienz', 3, -1, '⑩', 'Bündelwuchs', 1, 4, 1,
      () => `Schaltet den Kaufmodus <b>×10</b> und <b>×100</b> frei.`,
      (m) => { m.bulk = Math.max(m.bulk, 100); }),
    N('e_leicht', 'effizienz', 3, 1, '🍃', 'Leichte Zellwand', 10, 6, 1.42,
      lv => `Alle Strukturen kosten ${U.fmtPct(-(1 - Math.pow(0.96, lv)))} weniger.`,
      (m, lv) => { for (let i = 0; i < 8; i++) m.cost[i] *= Math.pow(0.96, lv); }, { req: 'e_kompakt' }),
    N('e_bulkmax', 'effizienz', 4, 0, '∞', 'Massenwuchs', 1, 11, 1,
      () => `Schaltet den Kaufmodus <b>MAX</b> frei — kauft so viel wie möglich.`,
      (m) => { m.bulk = 1e9; }, { req: 'e_bulk10' }),
    N('e_kompakt2', 'effizienz', 5, 0, '📏', 'Feine Struktur', 10, 14, 1.45,
      lv => `Kostenwachstum aller Strukturen −${(0.0025 * lv).toFixed(4)} (Untergrenze 1,10).`,
      (m, lv) => { m.costScale += 0.0025 * lv; }),
    N('e_klar', 'effizienz', 6, 0, '❄', 'Klare Ordnung', 12, 17, 1.42,
      lv => `Alle Strukturen kosten ${U.fmtPct(-(1 - Math.pow(0.955, lv)))} weniger.`,
      (m, lv) => { for (let i = 0; i < 8; i++) m.cost[i] *= Math.pow(0.955, lv); }),
    N('e_start', 'effizienz', 7, 0, '🎒', 'Nährstoffdepot', 8, 21, 1.50,
      lv => `Nach einem Sporenflug startest du mit <b>${U.fmt(1e3 * Math.pow(25, lv))}</b> Biomasse.`,
      (m, lv) => { if (lv > 0) m.startBio = Math.max(m.startBio, 1e3 * Math.pow(25, lv)); }),
    N('e_recyc', 'effizienz', 8, 0, '♻', 'Zellrecycling', 10, 27, 1.45,
      lv => `Alle Strukturen kosten ${U.fmtPct(-(1 - Math.pow(0.95, lv)))} weniger.`,
      (m, lv) => { for (let i = 0; i < 8; i++) m.cost[i] *= Math.pow(0.95, lv); }),
    N('e_dicht', 'effizienz', 9, 0, '🧱', 'Verdichtung', 10, 35, 1.48,
      lv => `Kostenwachstum aller Strukturen −${(0.002 * lv).toFixed(4)} (Untergrenze 1,10).`,
      (m, lv) => { m.costScale += 0.002 * lv; }),
    N('e_perf', 'effizienz', 10, 0, '💎', 'Perfekte Form', 12, 46, 1.50,
      lv => `Alle Strukturen kosten ${U.fmtPct(-(1 - Math.pow(0.95, lv)))} weniger.`,
      (m, lv) => { for (let i = 0; i < 8; i++) m.cost[i] *= Math.pow(0.95, lv); }, { sym: 1 }),
    N('e_null', 'effizienz', 11, 0, '⭘', 'Nullwiderstand', 10, 62, 1.55,
      lv => `Kostenwachstum aller Strukturen −${(0.0015 * lv).toFixed(4)} (Untergrenze 1,10).`,
      (m, lv) => { m.costScale += 0.0015 * lv; }, { sym: 2 }),

    /* ---------- SYMBIOSE ---------- */
    N('s_kette', 'symbiose', 1, 0, '⛓', 'Nährstoffkette', 10, 2, 1.42,
      lv => `${U.fmtPct(0.03 * lv)} Produktion pro freigeschalteter Strukturart.`,
      (m, lv, c) => { m.global *= 1 + 0.03 * lv * c.unlockedTypes; }),
    N('s_erfolg', 'symbiose', 2, 0, '✦', 'Erfolgssymbiose', 10, 4, 1.42,
      lv => `${U.fmtPct(0.006 * lv)} Produktion pro errungenem Erfolg.`,
      (m, lv, c) => { m.global *= 1 + 0.006 * lv * c.achCount; }),
    N('s_reife', 'symbiose', 3, 0, '📈', 'Reifebonus', 10, 6, 1.44,
      lv => `${U.fmtPct(0.02 * lv)} Produktion pro Reifegrad.`,
      (m, lv, c) => { m.global *= 1 + 0.02 * lv * c.level; }),
    N('s_netz', 'symbiose', 4, -1, '🕸', 'Sporennetz', 8, 9, 1.45,
      lv => `Produktion × (1 + ${(0.18 * lv).toFixed(2)} × log₁₀(Sporen gesamt)).`,
      (m, lv, c) => { m.global *= 1 + 0.18 * lv * Math.log10(c.sporeLife + 1); }),
    N('s_res', 'symbiose', 4, 1, '〰', 'Struktur-Resonanz', 10, 11, 1.44,
      lv => `${U.fmtPct(0.002 * lv)} Produktion pro gebauter Struktur.`,
      (m, lv, c) => { m.global *= 1 + 0.002 * lv * c.totalStructs; }, { req: 's_reife' }),
    N('s_viel', 'symbiose', 5, 0, '🎨', 'Artenvielfalt', 8, 16, 1.46,
      lv => `${U.fmtPct(0.09 * lv)} Produktion pro Strukturart mit mindestens 50 Stück.`,
      (m, lv, c) => { m.global *= 1 + 0.09 * lv * c.types50; }, { req: 's_netz' }),
    N('s_paar', 'symbiose', 6, 0, '🔗', 'Gegenseitigkeit', 10, 22, 1.45,
      lv => `Jede Struktur wird von der nächsthöheren gestärkt: ${U.fmtPct(0.012 * lv)} pro 25 Stück.`,
      (m, lv, c) => {
        for (let i = 0; i < 7; i++) m.struct[i] *= 1 + 0.012 * lv * Math.floor(c.structs[i + 1] / 25);
      }),
    N('s_gemein', 'symbiose', 7, 0, '🤝', 'Gemeinschaft', 12, 28, 1.46,
      lv => `Gesamte Produktion ${U.fmtPct(0.10 * lv)}.`,
      (m, lv) => { m.global *= 1 + 0.10 * lv; }),
    N('s_pilz', 'symbiose', 8, 0, '👆', 'Reizleitung', 10, 36, 1.48,
      lv => `Klick-Ertrag ${U.fmtPct(0.6 * lv)} und Klicks geben ${(0.4 * lv).toFixed(1)} % mehr der Sekundenproduktion.`,
      (m, lv) => { m.click *= 1 + 0.6 * lv; m.clickPct += 0.004 * lv; }),
    N('s_wald', 'symbiose', 9, 0, '🌲', 'Waldgedächtnis', 10, 47, 1.50,
      lv => `${U.fmtPct(0.02 * lv)} Produktion pro absolviertem Sporenflug.`,
      (m, lv, c) => { m.global *= 1 + 0.02 * lv * c.prestiges; }, { sym: 1 }),
    N('s_all', 'symbiose', 10, 0, '🌐', 'Allverbindung', 8, 62, 1.52,
      lv => `Gesamte Produktion ×${U.fmt(Math.pow(1.35, lv))} (×1,35 pro Stufe).`,
      (m, lv) => { m.global *= Math.pow(1.35, lv); }, { sym: 2 }),
    N('s_ewig', 'symbiose', 11, 0, '☯', 'Ewige Symbiose', 10, 88, 1.55,
      lv => `${U.fmtPct(0.18 * lv)} Produktion pro erschlossenem Biom.`,
      (m, lv, c) => { m.global *= 1 + 0.18 * lv * c.biomes; }, { sym: 3 }),

    /* ---------- ZERSETZUNG ---------- */
    N('z_zerfall', 'zersetzung', 1, 0, '☾', 'Langsamer Zerfall', 8, 2, 1.40,
      lv => `Offline-Wachstum wird ${2 * lv} Stunden länger angerechnet.`,
      (m, lv) => { m.offlineH += 2 * lv; }),
    N('z_verwert', 'zersetzung', 2, 0, '🍂', 'Verwertung', 10, 3, 1.42,
      lv => `Offline-Effizienz ${U.fmtPct(0.07 * lv)}.`,
      (m, lv) => { m.offlineEff += 0.07 * lv; }),
    N('z_ruhe', 'zersetzung', 3, 0, '💤', 'Ruhewachstum', 10, 5, 1.44,
      lv => `Wenn du 90 s nicht klickst, steigt die Produktion um bis zu ${U.fmtPct(0.08 * lv)}.`,
      (m, lv) => { m.idleMax += 0.08 * lv; }),
    N('z_traeg', 'zersetzung', 4, 0, '🪵', 'Trägheit', 12, 8, 1.42,
      lv => `Gesamte Produktion ${U.fmtPct(0.07 * lv)}.`,
      (m, lv) => { m.global *= 1 + 0.07 * lv; }),
    N('z_kompost', 'zersetzung', 5, -1, '🧺', 'Kompost', 10, 11, 1.44,
      lv => `Reifung (Fortschritt zum nächsten Reifegrad) ${U.fmtPct(0.15 * lv)}.`,
      (m, lv) => { m.xp *= 1 + 0.15 * lv; }),
    N('z_totholz', 'zersetzung', 5, 1, '🪨', 'Totholz', 8, 14, 1.48,
      lv => `Nach einem Sporenflug startest du mit <b>${U.fmt(500 * Math.pow(8, lv))}</b> Biomasse.`,
      (m, lv) => { if (lv > 0) m.startBio = Math.max(m.startBio, 500 * Math.pow(8, lv)); }, { req: 'z_traeg' }),
    N('z_nacht', 'zersetzung', 6, 0, '🌙', 'Nachtwuchs', 1, 20, 1,
      () => `Offline erzeugte Biomasse zählt voll für den Sporen-Gewinn.`,
      (m) => { m.offlineSpore = true; }, { req: 'z_kompost' }),
    N('z_tief', 'zersetzung', 7, 0, '🛏', 'Tiefschlaf', 10, 26, 1.45,
      lv => `Offline-Wachstum wird ${4 * lv} Stunden länger angerechnet.`,
      (m, lv) => { m.offlineH += 4 * lv; }),
    N('z_moder', 'zersetzung', 8, 0, '🕯', 'Modergeist', 10, 33, 1.46,
      lv => `Gesamte Produktion ${U.fmtPct(0.09 * lv)}.`,
      (m, lv) => { m.global *= 1 + 0.09 * lv; }),
    N('z_ewignacht', 'zersetzung', 9, 0, '🌑', 'Ewige Nacht', 6, 44, 1.50,
      lv => `Offline-Effizienz ${U.fmtPct(0.12 * lv)}.`,
      (m, lv) => { m.offlineEff += 0.12 * lv; }),
    N('z_humus', 'zersetzung', 10, 0, '🟫', 'Humusschicht', 10, 57, 1.50,
      lv => `Gesamte Produktion ×${U.fmt(Math.pow(1.25, lv))} (×1,25 pro Stufe).`,
      (m, lv) => { m.global *= Math.pow(1.25, lv); }, { sym: 1 }),
    N('z_erde', 'zersetzung', 11, 0, '🌍', 'Urerde', 10, 78, 1.52,
      lv => `Ruhewachstum-Bonus zusätzlich ${U.fmtPct(0.22 * lv)}.`,
      (m, lv) => { m.idleMax += 0.22 * lv; }, { sym: 2 }),

    /* ---------- AUTOMATIK ---------- */
    N('a_click', 'automatik', 1, 0, '👉', 'Reflexfäden', 10, 2, 1.45,
      lv => `Das Netz klickt ${lv}× pro Sekunde von selbst.`,
      (m, lv) => { m.autoClick += lv; }),
    N('a_s0', 'automatik', 2, -1, '🌱', 'Autokäufer: Hyphe', 1, 5, 1,
      () => `Kauft Hyphen automatisch, sobald genug Biomasse da ist.`,
      (m) => { m.auto[0] = true; }),
    N('a_s1', 'automatik', 2, 1, '🪢', 'Autokäufer: Rhizomorph', 1, 8, 1,
      () => `Kauft Rhizomorphen automatisch.`,
      (m) => { m.auto[1] = true; }, { req: 'a_click' }),
    N('a_s2', 'automatik', 3, 0, '⬢', 'Autokäufer: Knotenpunkt', 1, 13, 1,
      () => `Kauft Knotenpunkte automatisch.`,
      (m) => { m.auto[2] = true; }),
    N('a_s3', 'automatik', 4, 0, '🍄', 'Autokäufer: Fruchtkörper', 1, 19, 1,
      () => `Kauft Fruchtkörper automatisch.`,
      (m) => { m.auto[3] = true; }),
    N('a_s4', 'automatik', 5, 0, '✺', 'Autokäufer: Sporenlager', 1, 27, 1,
      () => `Kauft Sporenlager automatisch.`,
      (m) => { m.auto[4] = true; }),
    N('a_s5', 'automatik', 6, 0, '🌳', 'Autokäufer: Symbiosewurzel', 1, 37, 1,
      () => `Kauft Symbiosewurzeln automatisch.`,
      (m) => { m.auto[5] = true; }),
    N('a_s6', 'automatik', 7, 0, '❋', 'Autokäufer: Mykorrhiza', 1, 49, 1,
      () => `Kauft Mykorrhiza-Netze automatisch.`,
      (m) => { m.auto[6] = true; }),
    N('a_s7', 'automatik', 8, 0, '🜨', 'Autokäufer: Weltmyzel', 1, 63, 1,
      () => `Kauft Weltmyzel automatisch.`,
      (m) => { m.auto[7] = true; }),
    N('a_gold', 'automatik', 9, 0, '✨', 'Goldfühler', 10, 34, 1.45,
      lv => `Goldene Sporen erscheinen ${U.fmtPct(0.12 * lv)} häufiger und wirken ${U.fmtPct(0.15 * lv)} stärker.`,
      (m, lv) => { m.buffChance *= 1 + 0.12 * lv; m.buffMult *= 1 + 0.15 * lv; }),
    N('a_pres', 'automatik', 10, 0, '🔁', 'Sporen-Automat', 1, 72, 1,
      () => `Schaltet den automatischen Sporenflug frei (einstellbar im Sporen-Reiter).`,
      (m) => { m.autoPrestige = true; }, { sym: 1 }),
    N('a_takt', 'automatik', 11, 0, '⚡', 'Schneller Takt', 10, 95, 1.50,
      lv => `Automatik arbeitet ${1 + 0.5 * lv}× schneller, Produktion ${U.fmtPct(0.05 * lv)}.`,
      (m, lv) => { m.autoRate += 0.5 * lv; m.global *= 1 + 0.05 * lv; }, { sym: 2 }),

    /* ---------- TIEFE ---------- */
    N('t_sporen', 'tiefe', 1, 0, '✺', 'Sporenbildung', 10, 3, 1.45,
      lv => `Sporen-Gewinn ${U.fmtPct(0.08 * lv)}.`,
      (m, lv) => { m.spore *= 1 + 0.08 * lv; }),
    N('t_wurzel', 'tiefe', 2, 0, '⟱', 'Tiefe Wurzeln', 5, 9, 1.80,
      lv => `Sporen-Exponent +${(0.003 * lv).toFixed(3)} (sehr stark im späten Spiel).`,
      (m, lv) => { m.sporeExp += 0.003 * lv; }),
    N('t_pruef', 'tiefe', 3, -1, '⚔', 'Prüfungen', 1, 13, 1,
      () => `Schaltet den Reiter <b>Prüfungen</b> frei: freiwillige Handicaps mit dauerhaften Belohnungen.`,
      () => {}),
    N('t_genom', 'tiefe', 3, 1, '🧬', 'Genomkarte', 8, 17, 1.45,
      lv => `Mutationen kosten ${U.fmtPct(-(1 - Math.pow(0.92, lv)))} weniger Sporen.`,
      (m, lv) => { m.mutCost *= Math.pow(0.92, lv); }, { req: 't_wurzel' }),
    N('t_erinner', 'tiefe', 4, 0, '🧠', 'Erinnerung', 5, 23, 1.60,
      lv => `Beim Sporenflug behältst du ${(3 * lv)} % aller Strukturen.`,
      (m, lv) => { m.keepPct += 0.03 * lv; }),
    N('t_welt', 'tiefe', 5, 0, '🜨', 'Weltmyzel-Kode', 1, 31, 1,
      () => `Schaltet die achte Struktur frei: das <b>Weltmyzel</b>.`,
      () => {}),
    N('t_xp', 'tiefe', 6, 0, '📖', 'Reifebeschleunigung', 10, 38, 1.46,
      lv => `Reifung ${U.fmtPct(0.25 * lv)}.`,
      (m, lv) => { m.xp *= 1 + 0.25 * lv; }),
    N('t_sym', 'tiefe', 7, 0, '⚭', 'Symbiose-Zugang', 1, 52, 1,
      () => `Öffnet die letzte Schicht: <b>Symbiose</b>. Erschließe fremde Biome.`,
      () => {}),
    N('t_sporen2', 'tiefe', 8, 0, '🌪', 'Sporensturm', 10, 63, 1.50,
      lv => `Sporen-Gewinn ${U.fmtPct(0.12 * lv)}.`,
      (m, lv) => { m.spore *= 1 + 0.12 * lv; }, { sym: 1 }),
    N('t_wp', 'tiefe', 9, 0, '🕸', 'Netzgedächtnis', 5, 78, 1.60,
      lv => `Du erhältst ${U.fmtPct(0.06 * lv)} mehr Wachstumspunkte.`,
      (m, lv) => { m.wpBonus += 0.06 * lv; }, { sym: 1 }),
    N('t_wurzel2', 'tiefe', 10, 0, '⟰', 'Urwurzeln', 5, 98, 1.90,
      lv => `Sporen-Exponent +${(0.002 * lv).toFixed(3)}.`,
      (m, lv) => { m.sporeExp += 0.002 * lv; }, { sym: 2 }),
    N('t_kern', 'tiefe', 11, 0, '☀', 'Der Kern', 1, 160, 1,
      () => `Das Zentrum des Netzes erwacht: Produktion <b>×10</b>. Damit gilt das Netz als vollendet.`,
      (m) => { m.global *= 10; }, { sym: 3 })
  ];

  const NODE_BY_ID = {};
  NODES.forEach(n => NODE_BY_ID[n.id] = n);

  /* ---------- Struktur des Baums ----------
     Jeder Ast gabelt sich einmal und führt beide Zweige nach außen weiter.
     Ohne Gabelung wäre jeder Ast eine gerade Linie - sechs Speichen statt
     eines Geflechts. Wer hier etwas ändert, ändert nur das Aussehen und die
     Reihenfolge der Freischaltung, nicht die Wirkung der Knoten.

     Format: Knoten -> Elternknoten. Was hier fehlt, hängt am vorherigen
     Knoten desselben Astes. */
  const PARENT = {
    // Wachstum: ab dem Nährstoffdruck laufen zwei Zweige nach außen
    w_knoten: 'w_druck', w_frucht: 'w_druck',
    w_boden: 'w_knoten', w_lager: 'w_frucht',
    w_leben: 'w_boden', w_wurzel: 'w_lager',
    w_myk: 'w_leben', w_welt: 'w_myk', w_ewig: 'w_welt',

    // Effizienz: links der Massenkauf, rechts die Kostensenkung
    e_bulk10: 'e_kompakt', e_leicht: 'e_kompakt',
    e_bulkmax: 'e_bulk10', e_kompakt2: 'e_leicht',
    e_start: 'e_bulkmax', e_klar: 'e_kompakt2',
    e_perf: 'e_start', e_recyc: 'e_klar',
    e_dicht: 'e_recyc', e_null: 'e_dicht',

    // Symbiose: Sporennetz und Struktur-Resonanz teilen sich auf
    s_netz: 's_reife', s_res: 's_reife',
    s_viel: 's_netz', s_paar: 's_res',
    s_gemein: 's_viel', s_pilz: 's_paar',
    s_wald: 's_gemein', s_all: 's_pilz', s_ewig: 's_all',

    // Zersetzung: Kompost und Totholz als zwei Wege in die Nacht
    z_kompost: 'z_traeg', z_totholz: 'z_traeg',
    z_nacht: 'z_kompost', z_tief: 'z_totholz',
    z_moder: 'z_nacht', z_ewignacht: 'z_tief',
    z_humus: 'z_moder', z_erde: 'z_humus',

    // Automatik: zwei parallele Linien, damit die acht Autokäufer nicht
    // als eine lange Kette hintereinander stehen
    a_s0: 'a_click', a_s1: 'a_click',
    a_s2: 'a_s0', a_s3: 'a_s1',
    a_s4: 'a_s2', a_s5: 'a_s3',
    a_s6: 'a_s4', a_s7: 'a_s5',
    a_gold: 'a_s6', a_pres: 'a_s7', a_takt: 'a_gold',

    // Tiefe: Prüfungen und Genomkarte als Gabelung
    t_pruef: 't_wurzel', t_genom: 't_wurzel',
    t_erinner: 't_pruef', t_welt: 't_genom',
    t_xp: 't_erinner', t_sym: 't_welt',
    t_wp: 't_xp', t_sporen2: 't_sym',
    t_wurzel2: 't_sporen2', t_kern: 't_wurzel2'
  };

  /* Ring und Platz der Automatik: zwei Reihen nebeneinander. */
  const LAYOUT = {
    a_click: [1, 0],
    a_s0: [2, -1], a_s1: [2, 1], a_s2: [3, -1], a_s3: [3, 1],
    a_s4: [4, -1], a_s5: [4, 1], a_s6: [5, -1], a_s7: [5, 1],
    a_gold: [6, -1], a_pres: [6, 1], a_takt: [7, 0]
  };

  (function linkNodes() {
    const byBranch = {};
    NODES.forEach(n => (byBranch[n.b] = byBranch[n.b] || []).push(n));
    for (const b in byBranch) {
      byBranch[b].forEach((n, i) => {
        if (PARENT[n.id] !== undefined) n.req = PARENT[n.id];
        else if (n.req === undefined) n.req = i === 0 ? null : byBranch[b][i - 1].id;
      });
    }
    for (const id in LAYOUT) {
      const n = NODE_BY_ID[id];
      if (n) { n.ring = LAYOUT[id][0]; n.slot = LAYOUT[id][1]; }
    }
    // Sicherheitsnetz: kein Knoten darf sich im Kreis auf sich selbst beziehen
    NODES.forEach(n => {
      const gesehen = {};
      let cur = n;
      while (cur && cur.req) {
        if (gesehen[cur.id]) { console.warn('Kreis im Skillbaum bei', n.id); n.req = null; break; }
        gesehen[cur.id] = 1;
        cur = NODE_BY_ID[cur.req];
      }
    });
  })();

  /* Kosten systematisch: der Ring bestimmt den Grundpreis, die letzte Stufe
     kostet immer rund das 3,2-fache der ersten. */
  const RING_BASE = [0, 1, 1, 1, 1, 2, 2, 2, 3, 4, 5, 6];
  NODES.forEach(n => {
    const base = RING_BASE[n.ring] || 1;
    n.cb = n.max === 1 ? Math.max(2, Math.round(base * 2.5)) : base;
    n.cg = n.max === 1 ? 1 : 1 + 1.2 / n.max;
  });


  /* ---------- Anordnung ----------
     Radiales Baumlayout: Jeder Ast belegt einen festen Kreisausschnitt.
     Innerhalb davon teilen Geschwister den Ausschnitt untereinander auf,
     und zwar im Verhaeltnis dazu, wie viele Knoten an ihnen haengen.
     So ueberlappt nichts, und eine Gabelung bleibt bis nach aussen sichtbar.

     Frueher hing der Winkel nur an Ast und Platz, und die Streuung sank
     nach aussen - dadurch liefen alle Aeste zu geraden Speichen zusammen. */
  const SEKTOR = 48;          // Grad je Ast (von 60 verfuegbaren - Rest ist Luft)
  const R0 = 118;             // Abstand des ersten Rings vom Kern
  const DR = 86;              // Abstand zwischen zwei Ebenen

  const CHILDREN = {};
  NODES.forEach(n => { const k = n.req || '_wurzel'; (CHILDREN[k] = CHILDREN[k] || []).push(n); });

  /** Wie viele Endpunkte haengen an diesem Knoten? Bestimmt seine Breite. */
  const blattCache = {};
  function blaetter(n) {
    if (blattCache[n.id] !== undefined) return blattCache[n.id];
    const k = CHILDREN[n.id];
    return (blattCache[n.id] = k ? k.reduce((a, x) => a + blaetter(x), 0) : 1);
  }

  /** Kleine, immer gleiche Unregelmaessigkeit - damit es gewachsen wirkt. */
  function jitter(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return ((h % 1000) + 1000) % 1000 / 1000;
  }

  const posCache = {};
  (function anordnen() {
    function platziere(n, mitte, breite, tiefe) {
      const j = jitter(n.id);
      const rad = R0 + tiefe * DR + (j - 0.5) * 14;
      const a = mitte * Math.PI / 180;
      posCache[n.id] = { x: Math.cos(a) * rad, y: Math.sin(a) * rad, ang: mitte, rad, tiefe };
      const kinder = CHILDREN[n.id];
      if (!kinder) return;
      const gesamt = kinder.reduce((a2, k) => a2 + blaetter(k), 0);
      let lauf = mitte - breite / 2;
      kinder.forEach(k => {
        const anteil = breite * (blaetter(k) / gesamt);
        platziere(k, lauf + anteil / 2, anteil * 0.92, tiefe + 1);
        lauf += anteil;
      });
    }
    (CHILDREN['_wurzel'] || []).forEach(n => {
      platziere(n, BRANCHES[n.b].ang, SEKTOR, 0);
    });
  })();

  function nodePos(n) { return posCache[n.id] || { x: 0, y: 0, ang: 0, rad: 0, tiefe: 0 }; }

  /** Aussenrand eines Astes - fuer die Beschriftung. */
  function branchTip(key) {
    let best = null;
    NODES.forEach(n => {
      if (n.b !== key) return;
      const p2 = nodePos(n);
      if (!best || p2.rad > best.rad) best = p2;
    });
    return { ang: BRANCHES[key].ang, rad: best ? best.rad : 400 };
  }

  /* ---------- Freischalt-Bedingungen ----------
     Ein Knoten soll erst kaufbar sein, wenn er auch wirkt. Ohne das ließe
     sich zum Beispiel der Sporen-Gewinn ausbauen, bevor der erste
     Sporenflug überhaupt möglich ist - ein Punkt, der ins Leere geht.

       struct: i  -> Struktur i muss freigeschaltet sein
       spore: true -> mindestens ein Sporenflug absolviert
       sym: n     -> n erschlossene Biome (steht am Knoten selbst)          */
  const GATE = {
    w_ver: { struct: 1 }, w_knoten: { struct: 2 }, w_frucht: { struct: 3 },
    w_lager: { struct: 4 }, w_wurzel: { struct: 5 }, w_myk: { struct: 6 },
    w_welt: { struct: 7 },
    a_s1: { struct: 1 }, a_s2: { struct: 2 }, a_s3: { struct: 3 },
    a_s4: { struct: 4 }, a_s5: { struct: 5 }, a_s6: { struct: 6 }, a_s7: { struct: 7 },
    t_sporen: { spore: true }, t_wurzel: { spore: true }, t_genom: { spore: true },
    t_erinner: { spore: true }, z_nacht: { spore: true }, s_netz: { spore: true },
    e_start: { spore: true }, z_totholz: { spore: true }
  };
  NODES.forEach(n => { if (GATE[n.id]) n.gate = GATE[n.id]; });

  /* Verwebungen: rein sichtbare Querverbindungen zwischen benachbarten
     Aesten. Sie leuchten erst auf, wenn beide Enden gekauft sind - das
     Netz schliesst sich also sichtbar mit dem Fortschritt. */
  const WEAVES = [
    ['w_druck', 'e_kompakt'], ['e_klar', 's_reife'], ['s_gemein', 't_erinner'],
    ['t_xp', 'a_s4'], ['a_gold', 'z_moder'], ['z_traeg', 'w_boden'],
    ['w_leben', 'e_start'], ['s_viel', 't_genom'], ['z_kompost', 'a_click']
  ];

  function nodeCost(n, lv) { return Math.ceil(n.cb * Math.pow(n.cg, lv)); }

  /* ================= MUTATIONEN (Sporen) ================= */
  const M = (id, ic, name, max, cb, cg, d, f, opts) =>
    Object.assign({ id, ic, name, max, cb, cg, d, f }, opts || {});

  const MUTATIONS = [
    M('mu_teil', '🧫', 'Zellteilung', 10, 2, 2.4,
      lv => `Gesamte Produktion ×${U.fmt(Math.pow(1.6, lv))} (×1,60 pro Stufe).`,
      (m, lv) => { m.global *= Math.pow(1.6, lv); }),
    M('mu_klick', '👆', 'Klickmutation', 8, 12, 2.6,
      lv => `Klick-Ertrag ×${U.fmt(Math.pow(3, lv))}.`,
      (m, lv) => { m.click *= Math.pow(3, lv); }),
    M('mu_speicher', '🎒', 'Sporenspeicher', 10, 15, 2.6,
      lv => `Start-Biomasse nach dem Sporenflug: <b>${U.fmt(1e4 * Math.pow(60, lv))}</b>.`,
      (m, lv) => { if (lv > 0) m.startBio = Math.max(m.startBio, 1e4 * Math.pow(60, lv)); }),
    M('mu_reif', '📖', 'Reifebeschleuniger', 10, 18, 2.8,
      lv => `Reifung ×${U.fmt(Math.pow(1.5, lv))}.`,
      (m, lv) => { m.xp *= Math.pow(1.5, lv); }),
    M('mu_wind', '🌬', 'Sporenwind', 10, 5, 2.8,
      lv => `Sporen-Gewinn ×${U.fmt(Math.pow(1.10, lv))}.`,
      (m, lv) => { m.spore *= Math.pow(1.10, lv); }),
    M('mu_kappe', '🍄', 'Robuste Kappe', 8, 9, 3.0,
      lv => `Strukturen 1–4 produzieren ×${U.fmt(Math.pow(2, lv))}.`,
      (m, lv) => { for (let i = 0; i < 4; i++) m.struct[i] *= Math.pow(2, lv); }),
    M('mu_kolonie', '🐜', 'Kolonie', 10, 35, 2.8,
      lv => `Das Netz klickt ${3 * lv}× pro Sekunde zusätzlich.`,
      (m, lv) => { m.autoClick += 3 * lv; }),
    M('mu_schnitt', '✂', 'Kostenschnitt', 10, 25, 2.9,
      lv => `Alle Strukturen kosten ${U.fmtPct(-(1 - Math.pow(0.92, lv)))} weniger.`,
      (m, lv) => { for (let i = 0; i < 8; i++) m.cost[i] *= Math.pow(0.92, lv); }),
    M('mu_gold', '✨', 'Lockstoff', 8, 45, 3.0,
      lv => `Goldene Sporen ${U.fmtPct(0.2 * lv)} häufiger und ${U.fmtPct(0.25 * lv)} stärker.`,
      (m, lv) => { m.buffChance *= 1 + 0.2 * lv; m.buffMult *= 1 + 0.25 * lv; }),
    M('mu_tief', '⟱', 'Tiefenwurzel', 8, 22, 3.2,
      lv => `Strukturen 5–8 produzieren ×${U.fmt(Math.pow(2.5, lv))}.`,
      (m, lv) => { for (let i = 4; i < 8; i++) m.struct[i] *= Math.pow(2.5, lv); }),
    M('mu_gedaecht', '🌙', 'Erinnerungssporen', 6, 30, 3.0,
      lv => `Offline-Kappe +${6 * lv} h, Offline-Effizienz ${U.fmtPct(0.08 * lv)}.`,
      (m, lv) => { m.offlineH += 6 * lv; m.offlineEff += 0.08 * lv; }),
    M('mu_erbe', '🧬', 'Schnelles Erbe', 5, 40, 4.0,
      lv => `Beim Sporenflug behältst du zusätzlich ${2 * lv} % aller Strukturen.`,
      (m, lv) => { m.keepPct += 0.02 * lv; }),
    M('mu_rinde', '🌳', 'Symbiotische Rinde', 8, 60, 3.2,
      lv => `${U.fmtPct(0.025 * lv)} Produktion pro Reifegrad.`,
      (m, lv, c) => { m.global *= 1 + 0.025 * lv * c.level; }),
    M('mu_zeit', '⏩', 'Zeitraffer', 10, 80, 2.4,
      lv => `Gesamte Produktion ×${U.fmt(Math.pow(1.45, lv))} (×1,45 pro Stufe).`,
      (m, lv) => { m.global *= Math.pow(1.45, lv); }),
    M('mu_netz', '🕸', 'Netzverdichtung', 6, 120, 3.4,
      lv => `${U.fmtPct(0.02 * lv)} Produktion pro gekaufter Skill-Stufe.`,
      (m, lv, c) => { m.global *= 1 + 0.02 * lv * c.nodeLevels; }),
    M('mu_meister', '⚔', 'Prüfungsmeister', 3, 3000, 4.0,
      lv => `Alle Prüfungs-Belohnungen wirken ×${U.fmt(Math.pow(1.6, lv))}.`,
      (m, lv) => { m.challMult *= Math.pow(1.6, lv); }),
    M('mu_auto', '🔁', 'Sporen-Instinkt', 1, 2500, 1,
      () => `Schaltet den automatischen Sporenflug frei.`,
      (m) => { m.autoPrestige = true; }),
    M('mu_ewig', '♾', 'Ewige Sporen', 5, 400, 5.0,
      lv => `Sporen-Exponent +${(0.002 * lv).toFixed(3)}.`,
      (m, lv) => { m.sporeExp += 0.002 * lv; })
  ];
  const MUT_BY_ID = {};
  MUTATIONS.forEach(m => MUT_BY_ID[m.id] = m);
  function mutCost(mu, lv) { return Math.ceil(mu.cb * Math.pow(mu.cg, lv)); }

  /* ================= BIOME (Symbiose) ================= */
  const BIOMES = [
    { id: 'b_laub', ic: '🍂', name: 'Laubwald', cost: 1, d: 'Vertrauter Boden. Gesamte Produktion ×3.',
      f: m => { m.global *= 3; } },
    { id: 'b_moor', ic: '🌫', name: 'Moor', cost: 3, d: 'Nichts vergeht hier. Offline-Kappe ×2, Offline-Effizienz +30 %.',
      f: m => { m.offlineH *= 2; m.offlineEff += 0.3; } },
    { id: 'b_tundra', ic: '❄', name: 'Tundra', cost: 7, d: 'Sparsam und hart. Kosten ×0,7 und Kostenwachstum −0,012.',
      f: m => { for (let i = 0; i < 8; i++) m.cost[i] *= 0.7; m.costScale += 0.012; } },
    { id: 'b_regen', ic: '🌴', name: 'Regenwald', cost: 15, d: 'Überfluss. Gesamte Produktion ×8.',
      f: m => { m.global *= 8; } },
    { id: 'b_tiefsee', ic: '🌊', name: 'Tiefsee', cost: 32, d: 'Druck erzeugt Sporen. Sporen-Gewinn ×1,8 und Exponent +0,005.',
      f: m => { m.spore *= 1.8; m.sporeExp += 0.004; } },
    { id: 'b_vulkan', ic: '🌋', name: 'Vulkanhang', cost: 65, d: 'Asche nährt die Großen. Strukturen 5–8 ×25.',
      f: m => { for (let i = 4; i < 8; i++) m.struct[i] *= 25; } },
    { id: 'b_ur', ic: '🌲', name: 'Urwald', cost: 130, d: 'Unberührt seit Jahrtausenden. Produktion ×25, +40 % Wachstumspunkte.',
      f: m => { m.global *= 25; m.wpBonus += 0.4; } },
    { id: 'b_kosmos', ic: '✷', name: 'Sternenmoos', cost: 260, d: 'Das Netz verlässt den Boden. Gesamte Produktion ×100.',
      f: m => { m.global *= 100; } }
  ];

  /* ================= PRÜFUNGEN ================= */
  const CHALLENGES = [
    { id: 'p_duerre', ic: '🔆', name: 'Dürre',
      rule: 'Deine gesamte Produktion ist durch 1 000 geteilt.',
      goals: [1e9, 5e13, 1e19],
      rewardText: ['Produktion ×2', 'Produktion ×3 (statt ×2)', 'Produktion ×6 (statt ×3)'],
      apply: (m, t) => { if (t > 0) m.global *= [1, 2, 3, 6][t]; },
      restrict: m => { m.global /= 1000; } },
    { id: 'p_kahl', ic: '🪓', name: 'Kahlschlag',
      rule: 'Nur die ersten drei Strukturen produzieren etwas.',
      goals: [1e8, 1e12, 1e17],
      rewardText: ['Strukturen 1–4 ×3', 'Strukturen 1–4 ×6', 'Strukturen 1–4 ×15'],
      apply: (m, t) => { const v = [1, 3, 6, 15][t]; for (let i = 0; i < 4; i++) m.struct[i] *= v; },
      restrict: m => { for (let i = 3; i < 8; i++) m.struct[i] = 0; } },
    { id: 'p_frost', ic: '🧊', name: 'Frost',
      rule: 'Das Kostenwachstum aller Strukturen ist um 0,08 erhöht.',
      goals: [1e10, 1e14, 1e19],
      rewardText: ['Kostenwachstum −0,005', 'Kostenwachstum −0,010', 'Kostenwachstum −0,015'],
      apply: (m, t) => { m.costScale += [0, 0.005, 0.010, 0.015][t]; },
      restrict: m => { m.costScale -= 0.08; } },
    { id: 'p_stille', ic: '🤫', name: 'Stille',
      rule: 'Klicks geben nichts, Automatik-Klicks und Ruhewachstum sind aus.',
      goals: [1e11, 1e15, 1e20],
      rewardText: ['Offline-Effizienz +30 %', 'Offline-Effizienz +60 %', 'Offline-Effizienz +120 %'],
      apply: (m, t) => { m.offlineEff += [0, 0.3, 0.6, 1.2][t]; },
      restrict: m => { m.click = 0; m.clickPct = 0; m.autoClick = 0; m.idleMax = 0; } }
  ];
  const CHAL_BY_ID = {};
  CHALLENGES.forEach(c => CHAL_BY_ID[c.id] = c);

  /* ================= ERFOLGE ================= */
  // f(S) -> bool
  const ACH = [];
  const A = (id, name, d, f) => ACH.push({ id, name, d, f });

  [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e24, 1e30, 1e40].forEach((v, i) => {
    A('bio' + i, ['Erster Faden', 'Unter dem Laub', 'Untergrundnetz', 'Waldflüstern', 'Der stille Riese',
      'Kontinentalpilz', 'Biosphäre', 'Planetenhaut', 'Jenseits der Erde'][i],
      `Erreiche ${U.fmt(v)} Biomasse insgesamt.`, s => s.lifetime >= v);
  });
  [10, 50, 100, 200, 400].forEach((v, i) => {
    A('hyp' + i, 'Hyphenmeister ' + (i + 1), `Besitze ${v} Hyphen.`, s => s.structs[0] >= v);
  });
  [1, 25, 100, 250].forEach((v, i) => {
    A('frucht' + i, ['Erster Hut', 'Pilzring', 'Hexenring', 'Pilzstadt'][i],
      `Besitze ${v} Fruchtkörper.`, s => s.structs[3] >= v);
  });
  [5, 15, 30, 45, 60, 80].forEach((v, i) => {
    A('lvl' + i, 'Reifegrad ' + v, `Erreiche Reifegrad ${v}.`, s => s.level >= v);
  });
  [1, 10, 50, 200, 1000].forEach((v, i) => {
    A('pres' + i, ['Loslassen', 'Kreislauf', 'Gewohnheit', 'Sporenregen', 'Ewige Wiederkehr'][i],
      `Absolviere ${v === 1 ? 'einen Sporenflug' : v + ' Sporenflüge'}.`, s => s.prestiges >= v);
  });
  [1, 100, 1e4, 1e6, 1e9].forEach((v, i) => {
    A('spo' + i, 'Sporenernte ' + (i + 1), `Sammle insgesamt ${v === 1 ? 'eine Spore' : U.fmt(v) + ' Sporen'}.`, s => s.sporeLife >= v);
  });
  [10, 40, 100, 200, 350].forEach((v, i) => {
    A('node' + i, 'Netzweber ' + (i + 1), `Kaufe ${v} Skill-Stufen im Netz.`, s => E.nodeLevelSum() >= v);
  });
  [1, 3, 6, 8].forEach((v, i) => {
    A('biome' + i, 'Wanderer ' + (i + 1), `Erschließe ${v === 1 ? 'ein Biom' : v + ' Biome'}.`, s => s.biomes.length >= v);
  });
  A('click100', 'Fingerspitzengefühl', 'Klicke 100 Mal.', s => s.stats.clicks >= 100);
  A('click2000', 'Ausdauernd', 'Klicke 2 000 Mal.', s => s.stats.clicks >= 2000);
  A('gold1', 'Goldrausch', 'Fange eine goldene Spore.', s => s.stats.golds >= 1);
  A('gold25', 'Sporenjäger', 'Fange 25 goldene Sporen.', s => s.stats.golds >= 25);
  A('gold100', 'Glückspilz', 'Fange 100 goldene Sporen.', s => s.stats.golds >= 100);
  A('offline1', 'Es wächst weiter', 'Sammle Offline-Biomasse ein.', s => s.stats.offlineRuns >= 1);
  A('auto1', 'Von selbst', 'Schalte den ersten Autokäufer frei.', s => !!s.nodes['a_s0']);
  A('all8', 'Vollständig', 'Besitze mindestens eine von jeder Struktur.', s => s.structs.every(v => v > 0));
  A('chal1', 'Prüfling', 'Bestehe eine Prüfung.', s => E.challTierSum() >= 1);
  A('chal6', 'Geprüft', 'Bestehe 6 Prüfungsstufen.', s => E.challTierSum() >= 6);
  A('chal12', 'Unbeugsam', 'Bestehe alle Prüfungsstufen.', s => E.challTierSum() >= 12);
  A('mut10', 'Genbastler', 'Kaufe 10 Mutationsstufen.', s => E.mutLevelSum() >= 10);
  A('mut50', 'Evolution', 'Kaufe 50 Mutationsstufen.', s => E.mutLevelSum() >= 50);
  A('kern', 'Der Kern', 'Erwecke den Kern des Netzes.', s => !!s.nodes['t_kern']);
  A('speed', 'Sprinter', 'Erreiche 1 Mio. Biomasse in unter 10 Minuten nach einem Sporenflug.',
    s => s.runTotal >= 1e6 && s.runTime < 600);
  A('idle', 'Geduld', 'Lasse das Netz 30 Minuten am Stück ungestört wachsen.', s => s.stats.maxIdle >= 1800);

  /* ================= TICKER ================= */
  const NEWS = [
    'Ein Reh tritt auf einen Fruchtkörper. Das Netz merkt es sich.',
    'Regen. Die Hyphen dehnen sich um wenige Mikrometer.',
    'Zwei Buchen tauschen über dich Zucker aus. Du behältst etwas Provision.',
    'Ein Förster notiert: „Auffällig viele Pilze dieses Jahr."',
    'Irgendwo verrottet ein Baumstamm. Danke.',
    'Ein Kind zählt Pilze und kommt durcheinander.',
    'Die Nacht ist feucht. Gute Bedingungen.',
    'Ein Eichhörnchen vergräbt eine Nuss direkt über dir.',
    'Wissenschaftler nennen dich „Individuum". Wie klein sie denken.',
    'Ein Sporenwolke steigt auf. Reisen ohne Beine.',
    'Der Wald atmet aus.',
    'Unter der Schneedecke geht es einfach weiter.',
    'Ein Käfer verirrt sich in dein Geflecht und wird Teil des Plans.',
    'Ameisen bauen eine Straße über deinen Rücken.',
    'Ein alter Baum stirbt. Du wächst.',
    'Pilzsammler laufen über dich hinweg. Sie ahnen nichts.',
    'Der Boden riecht nach dir.',
    'Ein Sturm wirft Bäume um. Für dich ist das Frühstück.',
    'Die Wurzeln senden eine Warnung weiter. Über dich.',
    'Es ist still. Es ist gut.',
    'Ein Botaniker misst 9 km Netzlänge. Er hat noch nicht angefangen.',
    'Frost. Kurze Pause. Dann weiter.',
    'Ein Fuchs schläft über deinem größten Knotenpunkt.',
    'Der Waldboden wird ein Grad wärmer. Du bemerkst es sofort.',
    'Etwas Neues fällt zu Boden. Du bist schon da.',
    'Vögel bauen Nester aus deinen Fasern.',
    'Ein Blitz schlägt ein. Asche ist Nahrung.',
    'Der Mond zieht. Das Wasser folgt. Du auch.',
    'Ein Mensch sagt „nur ein Pilz". Das Netz schweigt höflich.',
    'Moos siedelt sich an. Nachbarn sind in Ordnung.',
    'Deine ältesten Fäden sind älter als das Dorf da drüben.',
    'Irgendwo entscheidet ein einzelnes Enzym über eine Milliarde Zellen.',
    'Der Wald schläft. Du nicht.',
    'Ein Reh frisst einen Fruchtkörper und trägt dich fort. Vielen Dank.',
    'Der Bach verlagert sich. Neues Terrain.',
    'Nach dem Feuer bist du das Erste, was zurückkommt.'
  ];

  /* ================= GOLDENE SPOREN (Buffs) ================= */
  const BUFFS = [
    { id: 'rausch', name: 'Sporenrausch', ic: '✨', dur: 45, col: '#f7c948',
      d: m => `Produktion ×${U.fmt(7 * m)} für 45 s`, f: (mm, mult) => { mm.global *= 7 * mult; } },
    { id: 'schub', name: 'Wachstumsschub', ic: '🌿', dur: 90, col: '#a6e85c',
      d: m => `Produktion ×${U.fmt(3 * m)} für 90 s`, f: (mm, mult) => { mm.global *= 3 * mult; } },
    { id: 'ernte', name: 'Reiche Ernte', ic: '🍯', dur: 0, col: '#f5a65b',
      d: m => `Sofort ${U.fmt(220 * m)} Sekunden Produktion`, instant: true },
    { id: 'finger', name: 'Flinke Fäden', ic: '👆', dur: 60, col: '#5bd4f5',
      d: m => `Klick-Ertrag ×${U.fmt(25 * m)} für 60 s`, f: (mm, mult) => { mm.click *= 25 * mult; } },
    { id: 'reife', name: 'Reifeschub', ic: '📖', dur: 120, col: '#b98bf0',
      d: m => `Reifung ×${U.fmt(5 * m)} für 120 s`, f: (mm, mult) => { mm.xp *= 5 * mult; } }
  ];
  const BUFF_BY_ID = {};
  BUFFS.forEach(b => BUFF_BY_ID[b.id] = b);

  return {
    STRUCTS, MILESTONE_STEP, BRANCHES, NODES, NODE_BY_ID, nodePos, nodeCost, branchTip, WEAVES,
    MUTATIONS, MUT_BY_ID, mutCost, BIOMES, CHALLENGES, CHAL_BY_ID, ACH, NEWS, BUFFS, BUFF_BY_ID
  };
})();
