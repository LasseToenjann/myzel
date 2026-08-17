/* ============================================================
   MYZEL - engine.js
   Spiel-Logik: Werte berechnen, Ticken, Kaufen, Prestige
   ============================================================ */
const E = (() => {

  let m = baseMods();          // aktuelle Modifikatoren
  let prod = new Array(8).fill(0);
  let total = 0;               // Biomasse pro Sekunde
  let clickGain = 1;
  let autoAcc = 0, clickAcc = 0;
  const events = [];           // Meldungen für die UI

  function baseMods() {
    return {
      global: 1,
      struct: [1, 1, 1, 1, 1, 1, 1, 1],
      cost: [1, 1, 1, 1, 1, 1, 1, 1],
      costScale: 0,
      click: 1, clickPct: 0.05, autoClick: 0,
      xp: 1,
      spore: 1, sporeExp: 0,
      offlineH: 4, offlineEff: 0.45, offlineSpore: false,
      idleMax: 0,
      keepPct: 0, startBio: 0,
      auto: [false, false, false, false, false, false, false, false],
      autoPrestige: false, autoRate: 1,
      bulk: 1, mutCost: 1, wpBonus: 0,
      buffChance: 1, buffMult: 1,
      challMult: 1
    };
  }

  /* ---------- Hilfszähler ---------- */
  function nodeLevelSum() { let t = 0; for (const k in S.nodes) t += S.nodes[k]; return t; }
  function mutLevelSum() { let t = 0; for (const k in S.muts) t += S.muts[k]; return t; }
  function challTierSum() { let t = 0; for (const k in S.chall) t += S.chall[k]; return t; }
  function structsTotal() { return S.structs.reduce((a, b) => a + b, 0); }
  function unlockedCount() { let c = 0; for (let i = 0; i < 8; i++) if (isUnlocked(i)) c++; return c; }

  function isUnlocked(i) {
    const st = D.STRUCTS[i];
    if (st.needNode && !S.nodes[st.needNode]) return false;
    return S.lifetime >= st.unlock || S.structs[i] > 0;
  }

  function symLevel() { return S.biomes.length; }

  const SOFTCAP = 1e11;     // ab hier greift die Daempfung
  const SOFTCAP_POW = 0.7;  // je kleiner, desto staerker gebremst

  /* ---------- Zentrale Neuberechnung ---------- */
  function recalc() {
    m = baseMods();
    const now = Date.now();

    const c = {
      level: S.level,
      achCount: S.ach.length,
      structs: S.structs,
      totalStructs: structsTotal(),
      unlockedTypes: unlockedCount(),
      types50: S.structs.filter(v => v >= 50).length,
      sporeLife: S.sporeLife,
      prestiges: S.prestiges,
      nodeLevels: nodeLevelSum(),
      biomes: S.biomes.length,
      sym: symLevel()
    };

    // 1) Skillbaum
    for (const id in S.nodes) {
      const lv = S.nodes[id]; if (!lv) continue;
      const n = D.NODE_BY_ID[id]; if (!n) continue;
      n.f(m, lv, c);
    }
    // 2) Mutationen
    for (const id in S.muts) {
      const lv = S.muts[id]; if (!lv) continue;
      const mu = D.MUT_BY_ID[id]; if (!mu) continue;
      mu.f(m, lv, c);
    }
    // 3) Biome
    S.biomes.forEach(id => {
      const b = D.BIOMES.find(x => x.id === id); if (b) b.f(m);
    });
    // 4) Erfolge
    m.global *= Math.pow(1.02, S.ach.length);
    // 5) Sporen (Lebenszeit)
    if (S.sporeLife > 0) m.global *= sporeMult(S.sporeLife);
    // 6) Symbiose-Punkte (Lebenszeit)
    if (S.spLife > 0) m.global *= 1 + 0.6 * Math.pow(Math.log10(1 + S.spLife), 2.6);
    // 7) Prüfungs-Belohnungen
    D.CHALLENGES.forEach(ch => {
      const t = S.chall[ch.id] || 0;
      if (t > 0) {
        const before = { global: m.global, costScale: m.costScale, offlineEff: m.offlineEff, struct: m.struct.slice() };
        ch.apply(m, t);
        // Prüfungsmeister verstärkt den Zugewinn
        if (m.challMult !== 1) {
          m.global = before.global * Math.pow(m.global / before.global, m.challMult);
          m.costScale = before.costScale + (m.costScale - before.costScale) * m.challMult;
          m.offlineEff = before.offlineEff + (m.offlineEff - before.offlineEff) * m.challMult;
          for (let i = 0; i < 8; i++) {
            if (before.struct[i] > 0) m.struct[i] = before.struct[i] * Math.pow(m.struct[i] / before.struct[i], m.challMult);
          }
        }
      }
    });
    // 8) Aktive Buffs (goldene Sporen)
    S.buffs = S.buffs.filter(b => b.until > now);
    S.buffs.forEach(b => {
      const def = D.BUFF_BY_ID[b.id];
      if (def && def.f) def.f(m, b.mult);
    });
    // 9) Ruhewachstum
    if (m.idleMax > 0) m.global *= 1 + m.idleMax * Math.min(1, S.idleTime / 90);
    // 10) Aktive Prüfung schränkt ein
    if (S.activeChall) {
      const ch = D.CHAL_BY_ID[S.activeChall];
      if (ch) ch.restrict(m);
    }

    // Weicher Deckel: oberhalb der Schwelle waechst der Gesamtmultiplikator
    // nur noch gedaempft. Ohne ihn schaukeln sich Produktion, Sporen und
    // Symbiose gegenseitig innerhalb weniger Stunden ins Unendliche.
    if (m.global > SOFTCAP) m.global = SOFTCAP * Math.pow(m.global / SOFTCAP, SOFTCAP_POW);

    // Produktion
    total = 0;
    for (let i = 0; i < 8; i++) {
      const cnt = S.structs[i];
      if (cnt <= 0) { prod[i] = 0; continue; }
      prod[i] = D.STRUCTS[i].prod * cnt * milestoneMult(i) * m.struct[i] * m.global;
      total += prod[i];
    }
    clickGain = (1 + total * m.clickPct) * m.click;

    // Reifegrad (nur nach oben)
    const lv = levelFor(S.lifetime * m.xp);
    if (lv > S.level) {
      const gained = lv - S.level;
      S.level = lv;
      events.push({ t: 'level', v: lv, wp: wpBase(lv) - wpBase(lv - gained) });
    }
    return m;
  }

  /** Produktions-Bonus aus allen je gesammelten Sporen.
      Der Exponent sinkt langsam mit der Groessenordnung ("weicher Deckel").
      Ohne diese Daempfung schaukeln sich Sporen und Produktion gegenseitig
      innerhalb weniger Stunden ins Unendliche. */
  function sporeMult(sl) {
    if (sl <= 0) return 1;
    const decades = Math.log10(1 + sl);
    return 1 + 1.5 * Math.pow(sl, 0.55 / (1 + 0.06 * decades));
  }

  function milestoneMult(i) { return Math.pow(2, Math.floor(S.structs[i] / D.MILESTONE_STEP)); }
  function milestoneProgress(i) { return (S.structs[i] % D.MILESTONE_STEP) / D.MILESTONE_STEP; }

  /* ---------- Reifegrad ---------- */
  // Zehnerpotenzen Biomasse pro Reifegrad
  const LVL_STEP = 0.40;
  function levelFor(eff) {
    if (!(eff > 10)) return 0;
    return Math.max(0, Math.floor((Math.log10(eff) - 1) / LVL_STEP));
  }
  function lifetimeForLevel(L) { return Math.pow(10, 1 + LVL_STEP * L); }
  function levelProgress() {
    const eff = Math.max(10, S.lifetime * m.xp);
    const cur = 1 + LVL_STEP * S.level;
    return U.clamp((Math.log10(eff) - cur) / LVL_STEP, 0, 1);
  }
  function wpBase(level) {
    let t = 0;
    for (let L = 1; L <= level; L++) t += 1 + Math.floor(L / 10);
    return t + Math.floor(level / 25) * 3;
  }
  function wpTotal() { return Math.floor(wpBase(S.level) * (1 + m.wpBonus)); }
  function wpSpent() {
    let t = 0;
    for (const id in S.nodes) {
      const n = D.NODE_BY_ID[id]; if (!n) continue;
      for (let l = 0; l < S.nodes[id]; l++) t += D.nodeCost(n, l);
    }
    return t;
  }
  function wpAvail() { return wpTotal() - wpSpent(); }

  /* ---------- Strukturen kaufen ---------- */
  /* Wichtig: Der Meilenstein verdoppelt alle 25 Stueck, das entspricht einem
     Wachstum von 2^(1/25) = 1,0281 pro Stueck. Das Kostenwachstum muss immer
     deutlich darueber liegen, sonst traegt sich jede weitere Struktur selbst
     und die Produktion laeuft ins Unendliche. */
  const GROWTH_FLOOR = 1.10;
  function growth(i) { return Math.max(GROWTH_FLOOR, D.STRUCTS[i].mul - m.costScale); }
  function unitCost(i, nth) {
    return D.STRUCTS[i].cost * m.cost[i] * Math.pow(growth(i), nth);
  }
  function costFor(i, amount) {
    const g = growth(i);
    return U.geoSum(D.STRUCTS[i].cost * m.cost[i] * Math.pow(g, S.bought[i]), g, amount);
  }
  function maxAffordable(i) {
    const g = growth(i);
    return U.geoMax(D.STRUCTS[i].cost * m.cost[i] * Math.pow(g, S.bought[i]), g, S.biomass);
  }
  function buyAmount(i) {
    const mode = S.buyMode;
    if (mode === -1) return Math.max(1, maxAffordable(i));
    return mode;
  }
  function canBuy(i, amount) {
    if (!isUnlocked(i)) return false;
    return S.biomass >= costFor(i, amount === undefined ? buyAmount(i) : amount);
  }
  function buy(i, amount) {
    if (!isUnlocked(i)) return 0;
    let a = amount === undefined ? buyAmount(i) : amount;
    if (a <= 0) return 0;
    let cost = costFor(i, a);
    if (cost > S.biomass) {
      a = maxAffordable(i);
      if (a <= 0) return 0;
      cost = costFor(i, a);
    }
    S.biomass -= cost;
    S.structs[i] += a;
    S.bought[i] += a;
    return a;
  }

  /* ---------- Klicken ---------- */
  function doClick(manual) {
    const g = clickGain;
    if (g <= 0) return 0;
    S.biomass += g;
    S.lifetime += g;
    S.runTotal += g;
    if (manual) { S.stats.clicks++; S.idleTime = 0; }
    return g;
  }

  /* ---------- Skillbaum ---------- */
  function nodeState(id) {
    const n = D.NODE_BY_ID[id];
    const lv = S.nodes[id] || 0;
    const gated = n.sym !== undefined && symLevel() < n.sym;
    const parentOk = !n.req || (S.nodes[n.req] || 0) > 0;
    const maxed = lv >= n.max;
    const cost = maxed ? Infinity : D.nodeCost(n, lv);
    return { n, lv, gated, parentOk, maxed, cost, canBuy: !gated && parentOk && !maxed && wpAvail() >= cost };
  }
  function buyNode(id) {
    const st = nodeState(id);
    if (!st.canBuy) return false;
    S.nodes[id] = st.lv + 1;
    recalc();
    return true;
  }
  function respec() {
    S.nodes = {};
    recalc();
  }

  /* ---------- Mutationen ---------- */
  function mutState(id) {
    const mu = D.MUT_BY_ID[id];
    const lv = S.muts[id] || 0;
    const maxed = lv >= mu.max;
    const cost = maxed ? Infinity : Math.ceil(D.mutCost(mu, lv) * m.mutCost);
    return { mu, lv, maxed, cost, canBuy: !maxed && S.sporen >= cost };
  }
  function buyMut(id) {
    const st = mutState(id);
    if (!st.canBuy) return false;
    S.sporen -= st.cost;
    S.muts[id] = st.lv + 1;
    recalc();
    return true;
  }

  /* ---------- Sporenflug (Prestige 1) ---------- */
  // Je kleiner der Exponent, desto laenger muss ein Durchlauf laufen,
  // um den Sporenbestand nennenswert zu erhoehen. Das ist die Bremse
  // des ganzen Spiels - vorsichtig aendern.
  const SPORE_EXP = 0.35;
  function sporeGain() {
    const base = S.runTotal / 1e9;
    if (base < 1) return 0;
    return Math.floor(Math.pow(base, SPORE_EXP + m.sporeExp) * m.spore);
  }
  function sporeProgress() {
    if (sporeGain() >= 1) return 1;
    return U.clamp(Math.log10(Math.max(1, S.runTotal)) / 9, 0, 1);
  }
  function canPrestige() { return !S.activeChall && sporeGain() >= 1; }

  function softReset(keepStructures) {
    const keep = keepStructures ? m.keepPct : 0;
    for (let i = 0; i < 8; i++) {
      const k = Math.floor(S.structs[i] * keep);
      S.structs[i] = k;
      S.bought[i] = k;
    }
    // Startkapital ist ein Vorsprung, kein Ertrag: es zählt weder für den
    // Reifegrad noch für den Sporen-Gewinn. Sonst entsteht eine Endlosschleife.
    S.biomass = m.startBio;
    S.runTotal = 0;
    S.runTime = 0;
    S.buffs = [];
  }

  function doPrestige() {
    if (!canPrestige()) return 0;
    const g = sporeGain();
    S.sporen += g;
    S.sporeLife += g;
    S.prestiges++;
    if (g > S.stats.bestSpores) S.stats.bestSpores = g;
    softReset(true);
    recalc();
    return g;
  }

  /* ---------- Symbiose (Prestige 2) ---------- */
  function symUnlocked() { return !!S.nodes['t_sym']; }
  function spGain() {
    if (!symUnlocked()) return 0;
    const base = S.sporeLife / 1e6;
    if (base < 1) return 0;
    return Math.floor(Math.pow(base, 0.25));
  }
  function canSym() { return !S.activeChall && spGain() >= 1; }
  function doSym() {
    if (!canSym()) return 0;
    const g = spGain();
    S.sp += g;
    S.spLife += g;
    S.symResets++;
    S.sporen = 0;
    S.sporeLife = 0;
    S.muts = {};
    S.prestiges = 0;
    softReset(false);
    recalc();
    return g;
  }
  function buyBiome(id) {
    const b = D.BIOMES.find(x => x.id === id);
    if (!b || S.biomes.includes(id) || S.sp < b.cost) return false;
    const idx = D.BIOMES.indexOf(b);
    if (idx > 0 && !S.biomes.includes(D.BIOMES[idx - 1].id)) return false;
    S.sp -= b.cost;
    S.biomes.push(id);
    recalc();
    return true;
  }

  /* ---------- Prüfungen ---------- */
  function challUnlocked() { return !!S.nodes['t_pruef']; }
  function enterChall(id) {
    if (!challUnlocked() || S.activeChall) return false;
    const ch = D.CHAL_BY_ID[id]; if (!ch) return false;
    if ((S.chall[id] || 0) >= ch.goals.length) return false;
    softReset(false);
    S.activeChall = id;
    recalc();
    return true;
  }
  function leaveChall(completed) {
    S.activeChall = null;
    softReset(false);
    recalc();
    return completed;
  }
  function challGoal(id) {
    const ch = D.CHAL_BY_ID[id];
    const t = S.chall[id] || 0;
    return t >= ch.goals.length ? Infinity : ch.goals[t];
  }

  /* ---------- Erfolge ---------- */
  function checkAch() {
    for (const a of D.ACH) {
      if (S.ach.includes(a.id)) continue;
      let ok = false;
      try { ok = a.f(S); } catch (e) { ok = false; }
      if (ok) {
        S.ach.push(a.id);
        events.push({ t: 'ach', a });
      }
    }
  }

  /* ---------- Goldene Sporen ---------- */
  function tickGold(dt) {
    S.goldTimer -= dt * m.buffChance;
    if (S.goldTimer <= 0) {
      S.goldTimer = U.rnd(95, 260);
      return true;   // FX soll eine spawnen
    }
    return false;
  }
  function catchGold() {
    // Sporenrausch ist der Hauptgewinn und etwas seltener als der Rest
    const roll = Math.random();
    const def = roll < 0.22 ? D.BUFFS[0] : U.pick(D.BUFFS.slice(1));
    const mult = m.buffMult;
    S.stats.golds++;
    if (def.instant) {
      const g = total * 220 * mult;
      S.biomass += g; S.lifetime += g; S.runTotal += g;
      return { def, mult, instant: g };
    }
    const existing = S.buffs.find(b => b.id === def.id);
    if (existing) existing.until = Math.max(existing.until, Date.now()) + def.dur * 1000;
    else S.buffs.push({ id: def.id, until: Date.now() + def.dur * 1000, mult });
    recalc();
    return { def, mult };
  }

  /* ---------- Haupttakt ---------- */
  function tick(dt) {
    if (!S) return;
    recalc();

    // Automatik-Klicks
    if (m.autoClick > 0) {
      clickAcc += m.autoClick * dt;
      const n = Math.floor(clickAcc);
      if (n > 0) { clickAcc -= n; S.biomass += clickGain * n; S.lifetime += clickGain * n; S.runTotal += clickGain * n; }
    }

    // Produktion
    const gain = total * dt;
    if (gain > 0) {
      S.biomass += gain;
      S.lifetime += gain;
      S.runTotal += gain;
    }
    if (total > S.stats.bestRate) S.stats.bestRate = total;

    // Autokäufer
    autoAcc += dt * m.autoRate;
    while (autoAcc >= 0.5) {
      autoAcc -= 0.5;
      for (let i = 7; i >= 0; i--) {
        if (!m.auto[i] || !S.autoBuy[i] || !isUnlocked(i)) continue;
        const amt = S.buyMode === -1 ? maxAffordable(i) : Math.min(buyAmount(i), maxAffordable(i));
        if (amt > 0) buy(i, amt);
      }
    }

    // Zeiten
    S.runTime += dt;
    S.playTime += dt;
    S.idleTime += dt;
    if (S.idleTime > S.stats.maxIdle) S.stats.maxIdle = S.idleTime;

    // Prüfung geschafft?
    if (S.activeChall) {
      const goal = challGoal(S.activeChall);
      if (S.runTotal >= goal) {
        const id = S.activeChall;
        const ch = D.CHAL_BY_ID[id];
        const t = (S.chall[id] || 0) + 1;
        S.chall[id] = t;
        leaveChall(true);
        events.push({ t: 'chall', ch, tier: t });
      }
    }

    // Auto-Sporenflug
    if (m.autoPrestige && S.autoPrestigeOn && !S.activeChall && sporeGain() >= S.autoPrestigeAt) {
      const g = doPrestige();
      if (g > 0) events.push({ t: 'autopres', v: g });
    }

    // Goldene Sporen
    if (tickGold(dt)) events.push({ t: 'gold' });

    checkAch();
    checkUnlockEvents();
  }

  // meldet neu freigeschaltete Strukturen
  let unlockSeen = null;
  function checkUnlockEvents() {
    if (!unlockSeen) { unlockSeen = S.structs.map((_, i) => isUnlocked(i)); return; }
    for (let i = 0; i < 8; i++) {
      const u = isUnlocked(i);
      if (u && !unlockSeen[i]) events.push({ t: 'struct', i });
      unlockSeen[i] = u;
    }
  }

  /* ---------- Offline ---------- */
  function offlineGain(seconds) {
    recalc();
    const cap = m.offlineH * 3600;
    const t = Math.min(seconds, cap);
    return { seconds: t, capped: seconds > cap, raw: seconds, gain: total * t * m.offlineEff, rate: total };
  }
  function applyOffline(res) {
    if (res.gain <= 0) return;
    S.biomass += res.gain;
    S.lifetime += res.gain;
    if (m.offlineSpore) S.runTotal += res.gain;
    S.stats.offlineRuns++;
    S.playTime += res.seconds;
    recalc();
  }

  /* ---------- Nächstes Ziel ---------- */
  function nextGoal() {
    // 1) nächste Struktur
    for (let i = 0; i < 8; i++) {
      const st = D.STRUCTS[i];
      if (isUnlocked(i)) continue;
      if (st.needNode && !S.nodes[st.needNode]) {
        return { txt: `Skill „${D.NODE_BY_ID[st.needNode].name}" schaltet ${st.name} frei`, p: 1 };
      }
      return { txt: `${st.name} bei ${U.fmt(st.unlock)} Biomasse gesamt`, p: U.clamp(S.lifetime / st.unlock, 0, 1) };
    }
    // 2) Sporenflug
    if (S.sporeLife === 0 && sporeGain() < 1) {
      return { txt: `Sporenflug bei ${U.fmt(1e9)} Biomasse im Durchlauf`, p: sporeProgress() };
    }
    // 3) Symbiose
    if (!symUnlocked()) {
      const n = D.NODE_BY_ID['t_sym'];
      return { txt: `Skill „${n.name}" öffnet die Symbiose-Schicht`, p: 1 };
    }
    if (spGain() < 1) {
      return { txt: `Symbiose bei ${U.fmt(1e6)} Sporen gesamt`, p: U.clamp(Math.log10(Math.max(1, S.sporeLife)) / 6, 0, 1) };
    }
    // 4) nächster Reifegrad
    return { txt: `Reifegrad ${S.level + 1}`, p: levelProgress() };
  }

  function timeToAfford(cost) {
    if (S.biomass >= cost) return 0;
    if (total <= 0) return Infinity;
    return (cost - S.biomass) / total;
  }

  return {
    get m() { return m; }, get prod() { return prod; }, get total() { return total; },
    get clickGain() { return clickGain; }, events,
    recalc, tick, milestoneMult, milestoneProgress, isUnlocked, symLevel,
    levelProgress, wpTotal, wpSpent, wpAvail, wpBase, lifetimeForLevel,
    growth, unitCost, costFor, maxAffordable, buyAmount, canBuy, buy, doClick,
    nodeState, buyNode, respec, mutState, buyMut,
    sporeGain, sporeProgress, canPrestige, doPrestige,
    symUnlocked, spGain, canSym, doSym, buyBiome,
    challUnlocked, enterChall, leaveChall, challGoal,
    checkAch, catchGold, offlineGain, applyOffline, nextGoal, timeToAfford, sporeMult,
    get softcap() { return { at: SOFTCAP, pow: SOFTCAP_POW }; },
    nodeLevelSum, mutLevelSum, challTierSum, structsTotal
  };
})();
