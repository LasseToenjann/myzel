/* ============================================================
   MYZEL - ui.js
   Alle Reiter, der Skillbaum und die Kopfzeile
   ============================================================ */
const UI = (() => {

  const TABS = [
    { id: 'netz', name: 'Netz', vis: () => true },
    { id: 'baum', name: 'Skillbaum', vis: () => true },
    { id: 'sporen', name: 'Sporen', vis: () => S.sporeLife > 0 || S.prestiges > 0 || S.lifetime >= 1e8 },
    { id: 'symbiose', name: 'Symbiose', vis: () => E.symUnlocked() },
    { id: 'pruefung', name: 'Prüfungen', vis: () => E.challUnlocked() },
    { id: 'erfolge', name: 'Erfolge', vis: () => true },
    { id: 'statistik', name: 'Statistik', vis: () => S.playTime > 120 },
    { id: 'optionen', name: 'Optionen', vis: () => true }
  ];

  /* Schreibt nur, wenn sich der Inhalt geaendert hat. Ohne das wuerden
     Knoepfe und Eingabefelder zehnmal pro Sekunde neu erzeugt - sie flackern
     dann und lassen sich weder anklicken noch beschriften. */
  function setHTML(el, html) { if (el && el.__h !== html) { el.innerHTML = html; el.__h = html; } }
  function setText(el, t) { t = String(t); if (el && el.textContent !== t) el.textContent = t; }
  function setW(el, pct) { const v = pct.toFixed(1) + '%'; if (el && el.style.width !== v) el.style.width = v; }

  let active = 'netz';
  const built = {};
  const R = {};             // DOM-Referenzen
  let selNode = null;

  /* ================= Kopfzeile & Reiter ================= */
  function initTabs() {
    const nav = U.$('#tabs');
    nav.innerHTML = '';
    TABS.forEach(t => {
      const b = U.el('button', 'tab-btn', t.name);
      b.dataset.tab = t.id;
      b.onclick = () => show(t.id);
      nav.appendChild(b);
      t.el = b;
    });
    refreshTabs();
  }

  function refreshTabs() {
    TABS.forEach(t => {
      const v = t.vis();
      t.el.classList.toggle('hidden', !v);
      if (v && !S.seenTabs.includes(t.id) && t.id !== 'netz') {
        if (!t.el.querySelector('.dot')) t.el.appendChild(U.el('span', 'dot'));
      }
    });
  }

  function show(id) {
    const t = TABS.find(x => x.id === id);
    if (!t || !t.vis()) return;
    active = id;
    if (!S.seenTabs.includes(id)) S.seenTabs.push(id);
    const dot = t.el.querySelector('.dot'); if (dot) dot.remove();
    TABS.forEach(x => x.el.classList.toggle('active', x.id === id));
    U.$$('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === id));
    if (!built[id]) { build(id); built[id] = true; }
    refreshTab(true);
    if (id === 'baum') fitTree();
  }

  function panel(id) { return U.$(`.tab-panel[data-tab="${id}"]`); }

  function build(id) {
    ({ netz: buildNetz, baum: buildBaum, sporen: buildSporen, symbiose: buildSym,
       pruefung: buildPruef, erfolge: buildErfolge, statistik: buildStat, optionen: buildOpt }[id] || (() => {}))();
  }

  /* ================= REITER: NETZ ================= */
  function buildNetz() {
    const p = panel('netz');
    p.innerHTML = `
      <div class="goalbar" id="goalbar"></div>
      <div class="click-zone">
        <button class="big-click" id="bigclick">
          <span class="bc-lbl">Nähren</span>
          <span class="bc-val" id="bc-val">+1</span>
        </button>
        <div class="click-info">
          <div id="ci-rate"></div>
          <div id="ci-idle" class="ci-idle"></div>
        </div>
      </div>
      <h2 class="sec">Strukturen</h2>
      <div class="buymode" id="buymode"></div>
      <div class="struct-list" id="structs"></div>
      <div class="ticker" id="ticker"></div>`;

    R.bigclick = U.$('#bigclick');
    R.bigclick.addEventListener('click', ev => {
      const g = E.doClick(true);
      FX.pop(ev.clientX, ev.clientY - 12, '+' + U.fmt(g));
      FX.burst(ev.clientX, ev.clientY, '#a6e85c', 7, 2.4);
      FX.sfx.click();
    });

    // Kaufmodus
    R.buymode = U.$('#buymode');
    // Strukturzeilen
    R.structs = U.$('#structs');
    R.structRows = [];
    D.STRUCTS.forEach((st, i) => {
      const row = U.el('div', 'struct');
      row.style.setProperty('--sc', st.col);
      row.innerHTML = `
        <div class="struct-icon">${st.ic}</div>
        <div class="struct-mid">
          <div class="struct-name">${st.name} <span class="struct-count" data-c></span> <span data-ms></span></div>
          <div class="struct-sub" data-sub></div>
          <div class="ms-bar"><div data-msbar></div></div>
        </div>
        <div class="struct-buy">
          <button class="buy-btn" data-buy>Kaufen</button>
          <div class="buy-amt" data-amt></div>
        </div>
        <button class="auto-tog hidden" data-auto>AUTO</button>`;
      const btn = row.querySelector('[data-buy]');
      btn.onclick = ev => {
        const a = E.buy(i);
        if (a > 0) {
          FX.sfx.buy();
          FX.burst(ev.clientX, ev.clientY, st.col, 10, 3);
          refreshNetz();
        } else FX.sfx.err();
      };
      const at = row.querySelector('[data-auto]');
      at.onclick = () => { S.autoBuy[i] = !S.autoBuy[i]; refreshNetz(); };
      R.structRows.push({ row, i, st,
        c: row.querySelector('[data-c]'), ms: row.querySelector('[data-ms]'),
        sub: row.querySelector('[data-sub]'), msbar: row.querySelector('[data-msbar]'),
        btn, amt: row.querySelector('[data-amt]'), auto: at });
      R.structs.appendChild(row);
    });
    R.goalbar = U.$('#goalbar');
    R.ticker = U.$('#ticker');
    tickerNext();
    setInterval(tickerNext, 15000);
    buildBuyMode();
  }

  function buildBuyMode() {
    const modes = [[1, '×1'], [10, '×10'], [100, '×100'], [-1, 'MAX']];
    R.buymode.innerHTML = '<span>Kaufmenge</span>';
    modes.forEach(([v, lbl]) => {
      const c = U.el('button', 'chip', lbl);
      c.dataset.v = v;
      c.onclick = () => { S.buyMode = v; buildBuyMode(); refreshNetz(); };
      R.buymode.appendChild(c);
    });
    R.buymode.appendChild(U.el('span', 'bm-hint', ''));
    refreshBuyMode();
  }

  function refreshBuyMode() {
    const max = E.m.bulk;
    U.$$('.chip', R.buymode).forEach(c => {
      const v = +c.dataset.v;
      const locked = (v === 10 || v === 100) ? max < 100 : v === -1 ? max < 1e9 : false;
      c.classList.toggle('hidden', locked);
      c.classList.toggle('active', S.buyMode === v);
    });
    if ((S.buyMode === 10 || S.buyMode === 100) && max < 100) S.buyMode = 1;
    if (S.buyMode === -1 && max < 1e9) S.buyMode = 1;
  }

  let tickerIdx = -1;
  function tickerNext() {
    if (!R.ticker) return;
    if (!S.opt.ticker) { R.ticker.style.display = 'none'; return; }
    R.ticker.style.display = '';
    let i;
    do { i = Math.floor(Math.random() * D.NEWS.length); } while (i === tickerIdx && D.NEWS.length > 1);
    tickerIdx = i;
    R.ticker.style.opacity = 0;
    setTimeout(() => { R.ticker.textContent = D.NEWS[i]; R.ticker.style.opacity = 1; }, 400);
  }

  function refreshNetz() {
    if (!built.netz) return;
    const g = E.nextGoal();
    if (!R.goalTxt) {
      R.goalbar.innerHTML = '<span class="gl">Nächstes Ziel</span><span class="gt"></span><span class="gp"><i></i></span>';
      R.goalTxt = U.$('.gt', R.goalbar); R.goalBar = U.$('.gp i', R.goalbar);
    }
    setHTML(R.goalTxt, g.txt);
    setW(R.goalBar, g.p * 100);

    setText(U.$('#bc-val'), '+' + U.fmt(E.clickGain));
    const idlePct = E.m.idleMax * Math.min(1, S.idleTime / 90);
    setHTML(U.$('#ci-rate'), `Ein Klick gibt <b>${U.fmt(E.clickGain)}</b> Biomasse.<br>
      Das Netz erzeugt <b>${U.fmt(E.total)}</b> pro Sekunde.` +
      (E.m.autoClick > 0 ? `<br>Automatik-Klicks: <b>${U.fmt(E.m.autoClick)}/s</b>` : ''));
    setHTML(U.$('#ci-idle'), E.m.idleMax > 0
      ? `Ruhewachstum: <b style="color:var(--acc)">${U.fmtPct(idlePct)}</b> ${idlePct < E.m.idleMax ? '(steigt, wenn du nicht klickst)' : '(voll)'}`
      : '');

    refreshBuyMode();
    R.structRows.forEach(r => {
      const un = E.isUnlocked(r.i);
      r.row.classList.toggle('hidden', !un);
      if (!un) return;
      const amt = E.buyAmount(r.i);
      const cost = E.costFor(r.i, Math.max(1, amt));
      const afford = S.biomass >= cost;
      r.row.classList.toggle('affordable', afford);
      setText(r.c, U.fmtInt(S.structs[r.i]));
      const msLv = Math.floor(S.structs[r.i] / D.MILESTONE_STEP);
      setHTML(r.ms, msLv > 0 ? `<span class="ms-badge">×${U.fmt(Math.pow(2, msLv))} Meilenstein</span>` : '');
      const share = E.total > 0 ? (E.prod[r.i] / E.total * 100) : 0;
      setHTML(r.sub, `<b>${U.fmt(E.prod[r.i])}</b>/s &nbsp;·&nbsp; ${share.toFixed(0)} % der Produktion
        &nbsp;·&nbsp; je Stück ${U.fmt(S.structs[r.i] > 0 ? E.prod[r.i] / S.structs[r.i] : D.STRUCTS[r.i].prod * E.m.struct[r.i] * E.m.global)}/s`);
      setW(r.msbar, E.milestoneProgress(r.i) * 100);
      setText(r.btn, U.fmt(cost));
      r.btn.disabled = !afford;
      const tt = E.timeToAfford(cost);
      setText(r.amt, (amt > 1 ? `${U.fmtInt(amt)} Stück` : '1 Stück') + (afford || tt === Infinity ? '' : ` · in ${U.fmtTimeShort(tt)}`));
      const canAuto = E.m.auto[r.i];
      r.auto.classList.toggle('hidden', !canAuto);
      r.auto.classList.toggle('on', S.autoBuy[r.i]);
      setText(r.auto, S.autoBuy[r.i] ? 'AUTO AN' : 'AUTO AUS');
    });
  }

  /* ================= REITER: SKILLBAUM ================= */
  let view = { x: 0, y: 0, z: 1 };
  let dragged = false;
  const nodeEls = {}, linkEls = {};

  function buildBaum() {
    const p = panel('baum');
    p.innerHTML = `
      <div class="tree-wrap" id="treewrap">
        <svg id="tree-svg"><g id="tree-g"></g></svg>
        <div class="tree-hud">
          <div class="wp-box"><div class="n" id="wp-n">0</div><div class="l">Wachstumspunkte</div></div>
          <div class="zoom-ctl">
            <button id="z-in">+</button><button id="z-out">−</button><button id="z-fit">⌂</button>
          </div>
          <div class="legend" id="legend"></div>
          <button class="btn sm" id="respec">Skillbaum zurücksetzen</button>
        </div>
        <div class="tree-hint">Ziehen zum Verschieben · Mausrad zum Zoomen · Knoten anklicken</div>
      </div>`;
    const g = U.$('#tree-g');
    R.treeG = g; R.treeWrap = U.$('#treewrap');

    // Ringe als Orientierung
    for (let r = 1; r <= 11; r++) {
      g.appendChild(U.svgEl('circle', { class: 'ring-guide', cx: 0, cy: 0, r: 105 + r * 82 }));
    }
    // Ast-Beschriftungen außen
    for (const k in D.BRANCHES) {
      const b = D.BRANCHES[k];
      const rad = 105 + 12.1 * 82, a = b.ang * Math.PI / 180;
      const t = U.svgEl('text', { class: 'branch-label', x: Math.cos(a) * rad, y: Math.sin(a) * rad, fill: b.col });
      t.textContent = b.name;
      g.appendChild(t);
    }

    // Verbindungen
    D.NODES.forEach(n => {
      if (!n.req) return;
      const a = D.nodePos(D.NODE_BY_ID[n.req]), b = D.nodePos(n);
      const l = U.svgEl('path', { class: 'tlink off', d: `M${a.x} ${a.y} L${b.x} ${b.y}` });
      l.style.setProperty('--lc', D.BRANCHES[n.b].col);
      g.appendChild(l);
      linkEls[n.id] = l;
    });
    // Kern
    const core = U.svgEl('g', { class: 'tcore' });
    core.appendChild(U.svgEl('circle', { r: 30, fill: 'rgba(79,224,160,.10)', stroke: 'rgba(79,224,160,.5)', 'stroke-width': 2 }));
    core.appendChild(U.svgEl('circle', { r: 15, fill: 'rgba(79,224,160,.85)' }));
    const ct = U.svgEl('text', { class: 'ic', y: 1, 'font-size': 16, fill: '#04140d' });
    ct.textContent = '❋'; core.appendChild(ct);
    const cl = U.svgEl('text', { class: 'lvl', y: 50, fill: '#7fa093' });
    cl.textContent = 'URSPRUNG'; core.appendChild(cl);
    g.appendChild(core);

    // Verbindung Kern -> Ring-1-Knoten
    D.NODES.filter(n => !n.req).forEach(n => {
      const b = D.nodePos(n);
      const l = U.svgEl('path', { class: 'tlink on', d: `M0 0 L${b.x} ${b.y}` });
      l.style.setProperty('--lc', D.BRANCHES[n.b].col);
      g.insertBefore(l, g.firstChild);
    });

    // Knoten
    D.NODES.forEach(n => {
      const pos = D.nodePos(n);
      const el = U.svgEl('g', { class: 'tnode', transform: `translate(${pos.x},${pos.y})` });
      el.style.setProperty('--nc', D.BRANCHES[n.b].col);
      el.appendChild(U.svgEl('circle', { class: 'bg', r: 21 }));
      const t = U.svgEl('text', { class: 'ic' }); t.textContent = n.ic;
      el.appendChild(t);
      const lv = U.svgEl('text', { class: 'lvl', y: 36 });
      el.appendChild(lv);
      el.addEventListener('click', ev => { ev.stopPropagation(); if (dragged) return; selectNode(n.id); });
      g.appendChild(el);
      nodeEls[n.id] = { el, lv, n };
    });

    // Legende
    const leg = U.$('#legend');
    for (const k in D.BRANCHES) {
      const b = D.BRANCHES[k];
      leg.appendChild(U.el('div', '', `<i style="background:${b.col}"></i>${b.name}`));
    }

    // Steuerung
    U.$('#respec').onclick = () => Game.confirm('Skillbaum zurücksetzen?',
      'Alle Wachstumspunkte werden frei und du kannst sie neu verteilen. Nichts geht dabei verloren.',
      () => { E.respec(); closePanel(); refreshTree(); refreshTop(); FX.toast('Skillbaum geleert', 'Alle Punkte sind wieder frei.', 'lime'); },
      'Punkte freigeben');
    U.$('#z-in').onclick = () => zoomBy(1.25);
    U.$('#z-out').onclick = () => zoomBy(0.8);
    U.$('#z-fit').onclick = fitTree;
    let drag = null;
    R.treeWrap.addEventListener('pointerdown', e => {
      if (e.target.closest('.node-panel') || e.target.closest('.tree-hud')) return;
      drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: 0 };
      R.treeWrap.classList.add('dragging');
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      if (drag.moved < 5) return;      // kleine Wackler sind noch ein Klick
      view.x = drag.vx + dx; view.y = drag.vy + dy;
      applyView();
    });
    const up = e => {
      if (!drag) return;
      dragged = drag.moved >= 5;
      const onNode = e.target && e.target.closest && e.target.closest('.tnode');
      if (!dragged && !onNode && (e.target.id === 'tree-svg' || e.target.id === 'treewrap')) closePanel();
      drag = null;
      R.treeWrap.classList.remove('dragging');
      setTimeout(() => { dragged = false; }, 0);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    R.treeWrap.addEventListener('wheel', e => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.14 : 0.88, e.clientX, e.clientY);
    }, { passive: false });

    fitTree();
  }

  function applyView() {
    if (R.treeG) R.treeG.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.z})`);
  }
  function zoomBy(f, cx, cy) {
    const r = R.treeWrap.getBoundingClientRect();
    cx = (cx === undefined ? r.width / 2 : cx - r.left);
    cy = (cy === undefined ? r.height / 2 : cy - r.top);
    const nz = U.clamp(view.z * f, 0.3, 2.4);
    const k = nz / view.z;
    view.x = cx - (cx - view.x) * k;
    view.y = cy - (cy - view.y) * k;
    view.z = nz;
    applyView();
  }
  function fitTree() {
    if (!R.treeWrap) return;
    const r = R.treeWrap.getBoundingClientRect();
    // Standard: nah genug, dass die Knoten lesbar sind - der Rest wird erkundet
    const reach = 105 + (highestRing() + 1.4) * 82;
    view.z = U.clamp(Math.min(r.width, r.height) / (reach * 2), 0.34, 0.95);
    view.x = r.width / 2; view.y = r.height / 2;
    applyView();
  }
  /** Der äußerste Ring, in dem schon etwas gekauft wurde (bestimmt den Startzoom). */
  function highestRing() {
    let h = 2;
    for (const id in S.nodes) {
      const n = D.NODE_BY_ID[id];
      if (S.nodes[id] > 0 && n && n.ring > h) h = n.ring;
    }
    return h;
  }

  function selectNode(id) {
    selNode = id;
    renderNodePanel();
    refreshTree();
  }
  function closePanel() {
    selNode = null;
    const p = U.$('.node-panel'); if (p) p.remove();
    refreshTree();
  }

  function renderNodePanel() {
    let p = U.$('.node-panel');
    if (!p) { p = U.el('div', 'node-panel'); R.treeWrap.appendChild(p); }
    if (!selNode) { p.remove(); return; }
    const st = E.nodeState(selNode), n = st.n, br = D.BRANCHES[n.b];
    const nextCost = st.maxed ? null : st.cost;
    let reqHtml = '';
    if (st.gated) reqHtml += `<div class="np-req">Benötigt ${n.sym} erschlossene${n.sym === 1 ? 's' : ''} Biom${n.sym === 1 ? '' : 'e'} (Symbiose-Schicht).</div>`;
    else if (!st.parentOk) reqHtml += `<div class="np-req">Benötigt zuerst: <b>${D.NODE_BY_ID[n.req].name}</b></div>`;
    else if (!st.maxed && E.wpAvail() < st.cost) reqHtml += `<div class="np-req">Noch ${U.fmtInt(st.cost - E.wpAvail())} Wachstumspunkte nötig.</div>`;

    p.innerHTML = `
      <button class="np-close" title="Schließen">×</button>
      <div class="np-branch" style="color:${br.col}">${br.ic} ${br.name}</div>
      <h3>${n.ic} ${n.name}</h3>
      <div class="np-lv">Stufe ${st.lv} / ${n.max}</div>
      ${st.lv > 0 ? `<div class="np-eff"><div class="k">Aktuell</div><div class="v">${n.d(st.lv)}</div></div>` : ''}
      ${!st.maxed ? `<div class="np-eff next"><div class="k">Nach dem Kauf</div><div class="v">${n.d(st.lv + 1)}</div></div>` : ''}
      ${st.maxed ? '<div class="np-cost">Voll ausgebaut.</div>'
        : `<div class="np-cost">Kosten: <b>${U.fmtInt(nextCost)}</b> Wachstumspunkte<br>
           <span style="font-size:12px">Verfügbar: ${U.fmtInt(E.wpAvail())}</span></div>`}
      ${reqHtml}
      ${st.maxed ? '' : `<button class="btn ${st.canBuy ? 'btn-primary' : ''}" id="np-buy" style="width:100%;margin-top:6px" ${st.canBuy ? '' : 'disabled'}>Ausbauen</button>`}`;
    p.querySelector('.np-close').onclick = closePanel;
    const b = p.querySelector('#np-buy');
    if (b) b.onclick = () => {
      if (E.buyNode(selNode)) {
        FX.sfx.node();
        ripple(selNode);
        renderNodePanel(); refreshTree(); refreshTop();
      } else FX.sfx.err();
    };
  }

  function ripple(id) {
    const pos = D.nodePos(D.NODE_BY_ID[id]);
    const c = U.svgEl('circle', { class: 'ripple', cx: pos.x, cy: pos.y, r: 22,
      stroke: D.BRANCHES[D.NODE_BY_ID[id].b].col });
    c.style.transformOrigin = `${pos.x}px ${pos.y}px`;
    R.treeG.appendChild(c);
    setTimeout(() => c.remove(), 950);
  }

  function refreshTree() {
    if (!built.baum) return;
    U.$('#wp-n').textContent = U.fmtInt(E.wpAvail());
    for (const id in nodeEls) {
      const { el, lv, n } = nodeEls[id];
      const st = E.nodeState(id);
      el.classList.toggle('locked', st.gated || !st.parentOk);
      el.classList.toggle('avail', !st.gated && st.parentOk);
      el.classList.toggle('owned', st.lv > 0);
      el.classList.toggle('maxed', st.maxed);
      el.classList.toggle('can', st.canBuy);
      el.classList.toggle('sel', selNode === id);
      lv.textContent = st.lv > 0 ? (st.maxed ? 'MAX' : st.lv + '/' + n.max) : (st.gated ? '🔒' : '');
      const link = linkEls[id];
      if (link) { link.classList.toggle('on', st.lv > 0); link.classList.toggle('off', st.lv === 0); }
    }
  }

  /* ================= REITER: SPOREN ================= */
  function buildSporen() {
    const p = panel('sporen');
    p.innerHTML = `
      <div class="prestige-box">
        <h3>✺ Sporenflug</h3>
        <div class="pb-gain"><span id="sp-gain">0</span> <span class="pb-unit">Sporen</span></div>
        <div class="pb-sub" id="sp-sub"></div>
        <div class="pbar"><div id="sp-bar"></div></div>
        <button class="btn big" id="do-pres">Sporenflug</button>
        <div class="stat-inline" id="sp-stats"></div>
        <div class="auto-pres hidden" id="sp-auto">
          <label><span class="switch" id="ap-sw"></span><span>Automatischer Sporenflug ab</span></label>
          <input type="text" id="ap-at" inputmode="numeric"> <span>Sporen</span>
        </div>
      </div>
      <h2 class="sec">Mutationen</h2>
      <p class="hint">Mutationen bleiben für immer. Sie kosten Sporen — den Multiplikator aus deinen
        <b>insgesamt gesammelten</b> Sporen verlierst du dabei nicht.</p>
      <div class="card-grid" id="muts"></div>`;

    R.spGain = U.$('#sp-gain'); R.spSub = U.$('#sp-sub'); R.spBar = U.$('#sp-bar');
    R.spBtn = U.$('#do-pres'); R.spStats = U.$('#sp-stats'); R.spAuto = U.$('#sp-auto');
    R.apSw = U.$('#ap-sw'); R.apAt = U.$('#ap-at');

    R.spBtn.onclick = () => Game.prestige();
    R.apSw.onclick = () => { S.autoPrestigeOn = !S.autoPrestigeOn; R.apSw.classList.toggle('on', S.autoPrestigeOn); };
    R.apAt.value = S.autoPrestigeAt;
    const commit = () => {
      const v = parseFloat(String(R.apAt.value).replace(/[^0-9.,eE+-]/g, '').replace(',', '.'));
      if (isFinite(v) && v >= 1) S.autoPrestigeAt = v;
      R.apAt.value = S.autoPrestigeAt;
    };
    R.apAt.onchange = commit;
    R.apAt.onblur = commit;

    R.mutGrid = U.$('#muts');
    R.mutCards = [];
    D.MUTATIONS.forEach(mu => {
      const c = U.el('div', 'card');
      c.innerHTML = `<h4>${mu.ic} ${mu.name}</h4><div class="lvl" data-lv></div>
        <p data-d></p><div class="cost" data-cost></div>
        <button class="cbtn" data-buy>Mutieren</button>`;
      c.querySelector('[data-buy]').onclick = ev => {
        if (E.buyMut(mu.id)) {
          FX.sfx.node(); FX.burst(ev.clientX, ev.clientY, '#f7c948', 12, 3); refreshSporen(); refreshTop();
        } else FX.sfx.err();
      };
      R.mutCards.push({ c, mu, lv: c.querySelector('[data-lv]'), d: c.querySelector('[data-d]'),
        cost: c.querySelector('[data-cost]'), btn: c.querySelector('[data-buy]') });
      R.mutGrid.appendChild(c);
    });
  }

  function refreshSporen() {
    if (!built.sporen) return;
    const g = E.sporeGain();
    const inCh = !!S.activeChall;
    const mult = E.sporeMult(S.sporeLife);
    setText(R.spGain, U.fmtInt(g));
    const nextAt = Math.pow((g + 1) / Math.max(1e-9, E.m.spore), 1 / (0.35 + E.m.sporeExp)) * 1e9;
    setHTML(R.spSub, `Du löst dich auf und beginnst neu. <b>Biomasse und Strukturen</b> gehen verloren —
      Skillbaum, Reifegrad, Erfolge und Mutationen bleiben.<br>
      Sporen geben dauerhaft Produktion: aktuell <b>${U.fmtMul(mult)}</b> aus ${U.fmtInt(S.sporeLife)} gesammelten Sporen.
      ${g > 0 ? `<br>Nächste Spore bei <b>${U.fmt(nextAt)}</b> Biomasse in diesem Durchlauf.` : ''}`);
    setW(R.spBar, E.sporeProgress() * 100);

    const can = g > 0 && !inCh;
    R.spBtn.classList.toggle('btn-primary', can);
    R.spBtn.disabled = !can;
    setText(R.spBtn, inCh ? 'Während einer Prüfung nicht möglich'
      : g > 0 ? `Sporenflug — ${U.fmtInt(g)} Sporen`
      : `Noch ${U.fmt(Math.max(0, 1e9 - S.runTotal))} Biomasse nötig`);

    setHTML(R.spStats, `
      <div>Sporen verfügbar<b>${U.fmtInt(S.sporen)}</b></div>
      <div>Sporen gesamt<b>${U.fmtInt(S.sporeLife)}</b></div>
      <div>Sporenflüge<b>${U.fmtInt(S.prestiges)}</b></div>
      <div>Dieser Durchlauf<b>${U.fmtTimeShort(S.runTime)}</b></div>
      <div>Bester Flug<b>${U.fmtInt(S.stats.bestSpores)}</b></div>`);

    R.spAuto.classList.toggle('hidden', !E.m.autoPrestige);
    R.apSw.classList.toggle('on', S.autoPrestigeOn);
    if (document.activeElement !== R.apAt && String(R.apAt.value) !== String(S.autoPrestigeAt)) {
      R.apAt.value = S.autoPrestigeAt;
    }

    R.mutCards.forEach(m => {
      const st = E.mutState(m.mu.id);
      m.c.classList.toggle('can', st.canBuy);
      m.c.classList.toggle('maxed', st.maxed);
      setText(m.lv, `Stufe ${st.lv} / ${m.mu.max}`);
      setHTML(m.d, m.mu.d(st.maxed ? st.lv : st.lv + 1));
      setText(m.cost, st.maxed ? '' : `${U.fmtInt(st.cost)} Sporen`);
      m.btn.disabled = !st.canBuy;
      setText(m.btn, st.maxed ? 'Voll ausgebaut' : st.lv > 0 ? 'Weiter mutieren' : 'Mutieren');
    });
  }

  /* ================= REITER: SYMBIOSE ================= */
  function buildSym() {
    const p = panel('symbiose');
    p.innerHTML = `
      <div class="prestige-box violet">
        <h3>☭ Symbiose</h3>
        <div class="pb-gain"><span id="sy-gain">0</span> <span class="pb-unit">Symbiose-Punkte</span></div>
        <div class="pb-sub" id="sy-sub"></div>
        <div class="pbar v"><div id="sy-bar"></div></div>
        <button class="btn big" id="do-sym">Symbiose eingehen</button>
        <div class="stat-inline" id="sy-stats"></div>
      </div>
      <h2 class="sec">Biome</h2>
      <p class="hint">Jedes Biom bleibt für immer und schaltet zusätzlich tiefere Ringe im Skillbaum frei.</p>
      <div class="card-grid" id="biomes"></div>`;
    R.syGain = U.$('#sy-gain'); R.sySub = U.$('#sy-sub'); R.syBar = U.$('#sy-bar');
    R.syBtn = U.$('#do-sym'); R.syStats = U.$('#sy-stats');
    R.syBtn.onclick = () => Game.symbiose();

    R.biomeGrid = U.$('#biomes');
    R.biomeCards = [];
    D.BIOMES.forEach((b, i) => {
      const c = U.el('div', 'card');
      c.innerHTML = `<h4>${b.ic} ${b.name}</h4><p>${b.d}</p>
        <div class="cost" data-cost>${b.cost} Symbiose-Punkte</div>
        <button class="cbtn" data-buy>Erschließen</button>`;
      c.querySelector('[data-buy]').onclick = ev => {
        if (E.buyBiome(b.id)) {
          FX.sfx.ach(); FX.burst(ev.clientX, ev.clientY, '#b98bf0', 22, 4);
          FX.toast('Biom erschlossen', b.name + ' — neue Ringe im Skillbaum sind offen.', 'violet');
          refreshSym(); refreshTree(); refreshTop();
        } else FX.sfx.err();
      };
      R.biomeCards.push({ c, b, i, btn: c.querySelector('[data-buy]'), cost: c.querySelector('[data-cost]') });
      R.biomeGrid.appendChild(c);
    });
  }

  function refreshSym() {
    if (!built.symbiose) return;
    const g = E.spGain();
    const mult = S.spLife > 0 ? 1 + 0.6 * Math.pow(Math.log10(1 + S.spLife), 2.6) : 1;
    setText(R.syGain, U.fmtInt(g));
    setHTML(R.sySub, `Das Netz geht eine Verbindung mit einem ganzen Lebensraum ein.
      <b>Sporen, Mutationen und der Durchlauf</b> gehen verloren — Skillbaum, Reifegrad,
      Erfolge und Biome bleiben.<br>
      Symbiose-Punkte geben dauerhaft Produktion: aktuell <b>${U.fmtMul(mult)}</b>.`);
    setW(R.syBar, U.clamp(Math.log10(Math.max(1, S.sporeLife)) / 6, 0, 1) * 100);

    const can = g > 0 && !S.activeChall;
    R.syBtn.classList.toggle('btn-primary', can);
    R.syBtn.disabled = !can;
    setText(R.syBtn, S.activeChall ? 'Während einer Prüfung nicht möglich'
      : g > 0 ? `Symbiose eingehen — ${U.fmtInt(g)} Punkte`
      : `Benötigt ${U.fmt(1e6)} gesammelte Sporen (aktuell ${U.fmt(S.sporeLife)})`);

    setHTML(R.syStats, `
      <div>Punkte verfügbar<b>${U.fmtInt(S.sp)}</b></div>
      <div>Punkte gesamt<b>${U.fmtInt(S.spLife)}</b></div>
      <div>Symbiosen<b>${U.fmtInt(S.symResets)}</b></div>
      <div>Biome<b>${S.biomes.length} / ${D.BIOMES.length}</b></div>`);

    R.biomeCards.forEach(x => {
      const owned = S.biomes.includes(x.b.id);
      const prevOk = x.i === 0 || S.biomes.includes(D.BIOMES[x.i - 1].id);
      const canB = !owned && prevOk && S.sp >= x.b.cost;
      x.c.classList.toggle('can', canB);
      x.c.classList.toggle('done', owned);
      x.c.classList.toggle('locked', !prevOk && !owned);
      x.btn.disabled = !canB;
      setText(x.btn, owned ? 'Erschlossen' : !prevOk ? 'Erst das vorige Biom' : 'Erschließen');
      setText(x.cost, owned ? '' : `${x.b.cost} Symbiose-Punkte`);
    });
  }

  /* ================= REITER: PRÜFUNGEN ================= */
  function buildPruef() {
    const p = panel('pruefung');
    p.innerHTML = `
      <h2 class="sec">Prüfungen</h2>
      <p class="hint">Eine Prüfung setzt deinen Durchlauf zurück und legt dir ein Handicap auf.
        Erreichst du das Ziel, wird die Belohnung <b>dauerhaft</b> gutgeschrieben. Du kannst jederzeit abbrechen.</p>
      <div id="chal-active"></div>
      <div class="card-grid" id="chals"></div>`;
    R.chalActive = U.$('#chal-active');
    R.chalGrid = U.$('#chals');
    R.chalCards = [];
    D.CHALLENGES.forEach(ch => {
      const c = U.el('div', 'card');
      c.innerHTML = `<h4>${ch.ic} ${ch.name}</h4><div class="lvl" data-lv></div>
        <p><b style="color:var(--danger)">Handicap:</b> ${ch.rule}</p>
        <div class="cost" data-goal></div><div class="cost" data-rew style="color:var(--acc)"></div>
        <button class="cbtn" data-go>Antreten</button>`;
      c.querySelector('[data-go]').onclick = () => Game.enterChall(ch.id);
      R.chalCards.push({ c, ch, lv: c.querySelector('[data-lv]'), goal: c.querySelector('[data-goal]'),
        rew: c.querySelector('[data-rew]'), btn: c.querySelector('[data-go]') });
      R.chalGrid.appendChild(c);
    });
  }

  function refreshPruef() {
    if (!built.pruefung) return;
    if (!R.chalBox) {
      R.chalActive.innerHTML = `<div class="prestige-box" style="border-color:rgba(239,107,107,.4)">
        <h3 id="ca-name"></h3><div class="pb-sub" id="ca-sub"></div>
        <div class="pbar"><div id="ca-bar"></div></div>
        <button class="btn btn-danger" id="chal-abort">Prüfung abbrechen</button></div>`;
      R.chalBox = U.$('.prestige-box', R.chalActive);
      R.caName = U.$('#ca-name'); R.caSub = U.$('#ca-sub'); R.caBar = U.$('#ca-bar');
      U.$('#chal-abort').onclick = () => { E.leaveChall(false); FX.toast('Prüfung abgebrochen', '', ''); refreshAll(); };
    }
    R.chalActive.classList.toggle('hidden', !S.activeChall);
    if (S.activeChall) {
      const ch = D.CHAL_BY_ID[S.activeChall];
      const goal = E.challGoal(S.activeChall);
      const pr = U.clamp(Math.log10(Math.max(1, S.runTotal)) / Math.log10(goal), 0, 1);
      setText(R.caName, `${ch.ic} ${ch.name} läuft`);
      setHTML(R.caSub, `${ch.rule}<br>Ziel: <b>${U.fmt(goal)}</b> Biomasse in diesem Durchlauf —
        aktuell <b>${U.fmt(S.runTotal)}</b>.`);
      setW(R.caBar, pr * 100);
    }

    R.chalCards.forEach(x => {
      const t = S.chall[x.ch.id] || 0;
      const done = t >= x.ch.goals.length;
      setText(x.lv, `Stufe ${t} / ${x.ch.goals.length}`);
      x.c.classList.toggle('done', done);
      setHTML(x.goal, done ? 'Alle Stufen bestanden.' : `Ziel: <b style="color:var(--txt)">${U.fmt(x.ch.goals[t])}</b> Biomasse im Durchlauf`);
      setText(x.rew, done ? x.ch.rewardText[t - 1] : 'Belohnung: ' + x.ch.rewardText[t]);
      x.c.classList.toggle('ready', !done && !S.activeChall);
      x.btn.disabled = done || !!S.activeChall;
      setText(x.btn, done ? 'Bestanden' : S.activeChall ? 'Andere Prüfung läuft' : t > 0 ? 'Nächste Stufe' : 'Antreten');
    });
  }

  /* ================= REITER: ERFOLGE ================= */
  function buildErfolge() {
    const p = panel('erfolge');
    p.innerHTML = `<h2 class="sec">Erfolge</h2>
      <p class="hint" id="ach-info"></p><div class="ach-grid" id="achs"></div>`;
    R.achGrid = U.$('#achs');
    R.achEls = {};
    D.ACH.forEach(a => {
      const e = U.el('div', 'ach', `<div class="an">${a.name}</div><div class="ad">${a.d}</div>`);
      R.achGrid.appendChild(e);
      R.achEls[a.id] = e;
    });
  }
  function refreshErfolge() {
    if (!built.erfolge) return;
    setHTML(U.$('#ach-info'), `<b>${S.ach.length} / ${D.ACH.length}</b> errungen —
      jeder Erfolg gibt dauerhaft <b>+2 %</b> Produktion (aktuell ${U.fmtMul(Math.pow(1.02, S.ach.length))}).`);
    D.ACH.forEach(a => R.achEls[a.id].classList.toggle('got', S.ach.includes(a.id)));
  }

  /* ================= REITER: STATISTIK ================= */
  function buildStat() {
    panel('statistik').innerHTML = `<h2 class="sec">Statistik</h2><div class="stat-grid" id="stats"></div>`;
    R.statGrid = U.$('#stats');
  }
  function refreshStat() {
    if (!built.statistik) return;
    const rows = [
      ['Biomasse jetzt', U.fmt(S.biomass)],
      ['Produktion', U.fmt(E.total) + ' /s'],
      ['Biomasse gesamt', U.fmt(S.lifetime)],
      ['Dieser Durchlauf', U.fmt(S.runTotal)],
      ['Reifegrad', S.level],
      ['Wachstumspunkte', `${U.fmtInt(E.wpAvail())} frei / ${U.fmtInt(E.wpTotal())}`],
      ['Skill-Stufen gekauft', U.fmtInt(E.nodeLevelSum())],
      ['Strukturen gesamt', U.fmtInt(E.structsTotal())],
      ['Produktions-Multiplikator', U.fmtMul(E.m.global) + (E.m.global >= E.softcap.at ? ' (gedämpft)' : '')],
      ['Sporen gesamt', U.fmtInt(S.sporeLife)],
      ['Sporenflüge', U.fmtInt(S.prestiges)],
      ['Symbiose-Punkte', U.fmtInt(S.spLife)],
      ['Klicks', U.fmtInt(S.stats.clicks)],
      ['Goldene Sporen', U.fmtInt(S.stats.golds)],
      ['Erfolge', `${S.ach.length} / ${D.ACH.length}`],
      ['Beste Produktion', U.fmt(S.stats.bestRate) + ' /s'],
      ['Spielzeit', U.fmtTime(S.playTime)],
      ['Begonnen am', new Date(S.stats.started).toLocaleDateString('de-DE')]
    ];
    if (!R.statCells || R.statCells.length !== rows.length) {
      R.statGrid.innerHTML = rows.map(r =>
        `<div class="stat-card"><div class="sl">${r[0]}</div><div class="sv"></div></div>`).join('');
      R.statCells = U.$$('.sv', R.statGrid);
    }
    rows.forEach((r, i) => setText(R.statCells[i], r[1]));
  }

  /* ================= REITER: OPTIONEN ================= */
  function buildOpt() {
    const p = panel('optionen');
    p.innerHTML = `
      <h2 class="sec">Einstellungen</h2>
      <div id="opts"></div>
      <h2 class="sec" style="margin-top:26px">Name</h2>
      <div class="opt-row name-row">
        <div style="min-width:170px">
          <div class="ol">Name deines Myzels</div>
          <div class="od">Nur für die Bestenliste. Wird ausschließlich gesendet, wenn du dort
            auf „Ergebnis senden" klickst.</div>
        </div>
        <input type="text" id="opt-name" maxlength="22" placeholder="z. B. Waldgeflecht">
        <button class="btn sm" id="opt-lb">Bestenliste öffnen</button>
      </div>
      <h2 class="sec" style="margin-top:26px">Spielstand</h2>
      <p class="hint">Der Spielstand liegt im Browser dieses Geräts. Sichere ihn als Text, wenn du ihn behalten willst.</p>
      <div class="opt-row" style="gap:10px">
        <button class="btn sm" id="sv-exp">In Textfeld exportieren</button>
        <button class="btn sm" id="sv-copy">In Zwischenablage</button>
        <button class="btn sm" id="sv-file">Als Datei speichern</button>
        <button class="btn sm" id="sv-imp">Aus Textfeld laden</button>
        <button class="btn sm" id="sv-save">Jetzt speichern</button>
      </div>
      <textarea class="save-area" id="sv-area" placeholder="Spielstand hier einfügen und auf „Aus Textfeld laden" klicken"></textarea>
      <div class="opt-row" style="margin-top:16px;border-color:rgba(239,107,107,.3)">
        <div><div class="ol">Neu beginnen</div>
          <div class="od">Löscht diesen Spielstand vollständig und startet ein neues Myzel.
            Exportiere vorher, wenn du ihn behalten willst.</div></div>
        <button class="btn btn-danger sm" id="sv-reset">Alles zurücksetzen</button>
      </div>
      <h2 class="sec" style="margin-top:26px">Tasten</h2>
      <div class="hint" id="keys"></div>
      <div class="hint" style="opacity:.6;margin-top:20px">MYZEL — Das stille Netz · v1.0</div>`;

    const opts = U.$('#opts');
    const rows = [
      ['sound', 'Ton', 'Kurze Klänge bei Klicks, Käufen und Erfolgen.'],
      ['particles', 'Partikel', 'Sporen und Funken. Ausschalten spart Leistung.'],
      ['ticker', 'Waldmeldungen', 'Kleine Textzeilen unter den Strukturen.'],
      ['offline', 'Offline-Wachstum', 'Rechnet Zeit an, in der das Spiel geschlossen war.'],
      ['confirmPrestige', 'Nachfrage vor Reset', 'Fragt vor Sporenflug und Symbiose nach.']
    ];
    rows.forEach(([k, name, d]) => {
      const r = U.el('div', 'opt-row', `<div><div class="ol">${name}</div><div class="od">${d}</div></div>
        <span class="switch ${S.opt[k] ? 'on' : ''}" data-k="${k}"></span>`);
      r.querySelector('.switch').onclick = e => {
        S.opt[k] = !S.opt[k];
        e.target.classList.toggle('on', S.opt[k]);
        if (k === 'ticker') tickerNext();
      };
      opts.appendChild(r);
    });
    const nr = U.el('div', 'opt-row', `<div><div class="ol">Zahlenformat</div>
      <div class="od">Kurz: 1,25 Mrd · Wissenschaftlich: 1.25e9</div></div>
      <div style="display:flex;gap:6px"><button class="chip" data-n="kurz">Kurz</button>
      <button class="chip" data-n="wiss">Wissenschaftlich</button></div>`);
    U.$$('.chip', nr).forEach(c => c.onclick = () => {
      S.opt.notation = c.dataset.n;
      U.$$('.chip', nr).forEach(x => x.classList.toggle('active', x.dataset.n === S.opt.notation));
    });
    U.$$('.chip', nr).forEach(x => x.classList.toggle('active', x.dataset.n === S.opt.notation));
    opts.appendChild(nr);

    U.$('#opt-name').value = S.name || '';
    const nameIn = U.$('#opt-name');
    const saveName = e => { S.name = e.target.value.trim().slice(0, 22); };
    nameIn.onchange = saveName; nameIn.onblur = saveName;
    U.$('#opt-lb').onclick = () => Game.showLeaderboard();

    U.$('#sv-exp').onclick = () => { U.$('#sv-area').value = Save.exportStr(); };
    U.$('#sv-copy').onclick = async () => {
      try { await navigator.clipboard.writeText(Save.exportStr()); FX.toast('Kopiert', 'Spielstand liegt in der Zwischenablage.', 'lime'); }
      catch (e) { U.$('#sv-area').value = Save.exportStr(); FX.toast('Bitte manuell kopieren', 'Der Spielstand steht im Textfeld.', ''); }
    };
    U.$('#sv-file').onclick = () => {
      const blob = new Blob([Save.exportStr()], { type: 'text/plain' });
      const a = U.el('a'); a.href = URL.createObjectURL(blob);
      a.download = 'myzel-spielstand-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
    U.$('#sv-imp').onclick = () => {
      const v = U.$('#sv-area').value.trim();
      if (!v) return FX.toast('Nichts zu laden', 'Füge zuerst einen Spielstand ein.', '');
      Game.confirm('Spielstand laden?', 'Dein aktueller Fortschritt wird ersetzt.', () => {
        if (Save.importStr(v)) { FX.toast('Geladen', 'Willkommen zurück.', 'lime'); Game.afterLoad(); }
        else FX.toast('Fehlerhafter Spielstand', 'Der Text konnte nicht gelesen werden.', '');
      });
    };
    U.$('#sv-save').onclick = () => { Save.write(); FX.toast('Gespeichert', '', 'lime'); };
    U.$('#sv-reset').onclick = () => {
      Game.confirm('Wirklich alles zurücksetzen?', 'Reifegrad, Skillbaum, Sporen und Biome sind dann weg. Das lässt sich nicht rückgängig machen.', () => {
        Save.wipe(); location.reload();
      }, 'Alles löschen');
    };
    U.$('#keys').innerHTML = `
      <b>1 – 8</b> Struktur kaufen &nbsp;·&nbsp; <b>M</b> alle kaufbaren Strukturen kaufen &nbsp;·&nbsp;
      <b>Leertaste</b> nähren (klicken) &nbsp;·&nbsp; <b>Q W E R T Z</b> Reiter wechseln &nbsp;·&nbsp;
      <b>P</b> Sporenflug &nbsp;·&nbsp; <b>S</b> speichern`;
  }

  /* ================= Kopfzeile ================= */
  function refreshTop() {
    U.$('#t-biomass').textContent = U.fmt(S.biomass);
    U.$('#t-rate').textContent = '+' + U.fmt(E.total) + ' /s';
    U.$('#t-level').textContent = S.level;
    const p = E.levelProgress();
    U.$('#t-xpfill').style.width = (p * 100).toFixed(1) + '%';
    U.$('#t-xptxt').textContent = (p * 100).toFixed(1) + ' %';
    U.$('#t-wp').textContent = U.fmtInt(E.wpAvail());
    const sw = U.$('#t-spore-wrap');
    sw.classList.toggle('hidden', S.sporeLife === 0 && S.sporen === 0);
    U.$('#t-spore').textContent = U.fmtInt(S.sporen);
    const pw = U.$('#t-sp-wrap');
    pw.classList.toggle('hidden', !E.symUnlocked() && S.spLife === 0);
    U.$('#t-sp').textContent = U.fmtInt(S.sp);
    U.$('#btn-sound').classList.toggle('off', !S.opt.sound);
    refreshBuffs();
  }

  /** Laufende Buffs der goldenen Sporen mit Restzeit. */
  function refreshBuffs() {
    let box = U.$('#buffbar');
    if (!box) { box = U.el('div', '', ''); box.id = 'buffbar'; U.$('#topbar').insertBefore(box, U.$('.top-right')); }
    const now = Date.now();
    const act = S.buffs.filter(b => b.until > now);
    if (!act.length) { box.innerHTML = ''; return; }
    box.innerHTML = act.map(b => {
      const def = D.BUFF_BY_ID[b.id]; if (!def) return '';
      const left = (b.until - now) / 1000;
      const pct = U.clamp(left / def.dur, 0, 1) * 100;
      return `<div class="buff" style="--bc:${def.col}" title="${def.d(b.mult)}">
        <span class="bi">${def.ic}</span><span class="bn">${def.name}</span>
        <span class="bt">${Math.ceil(left)} s</span><i style="width:${pct}%"></i></div>`;
    }).join('');
  }

  function pulse(sel) {
    const e = U.$(sel); if (!e) return;
    e.classList.remove('pulse'); void e.offsetWidth; e.classList.add('pulse');
  }

  /* ================= Takt ================= */
  function refreshTab(force) {
    ({ netz: refreshNetz, baum: refreshTree, sporen: refreshSporen, symbiose: refreshSym,
       pruefung: refreshPruef, erfolge: refreshErfolge, statistik: refreshStat }[active] || (() => {}))();
  }
  function refreshAll() {
    refreshTop(); refreshTabs(); refreshTab(true);
  }

  return { initTabs, show, refreshTop, refreshTab, refreshAll, refreshTabs, refreshTree, pulse, fitTree,
    get active() { return active; } };
})();
