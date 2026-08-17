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
    { id: 'erfolge', name: 'Erfolge', vis: () => true },
    { id: 'statistik', name: 'Statistik', vis: () => true },
    { id: 'optionen', name: 'Optionen', vis: () => false }   // nur über das Menü oben rechts
  ];

  /* Schreibt nur, wenn sich der Inhalt geaendert hat. Ohne das wuerden
     Knoepfe und Eingabefelder zehnmal pro Sekunde neu erzeugt - sie flackern
     dann und lassen sich weder anklicken noch beschriften. */
  function setHTML(el, html) { if (el && el.__h !== html) { el.innerHTML = html; el.__h = html; } }
  function setText(el, t) { t = String(t); if (el && el.textContent !== t) el.textContent = t; }
  function setW(el, pct) { const v = pct.toFixed(1) + '%'; if (el && el.style.width !== v) el.style.width = v; }

  let active = 'netz';
  let vorherigerReiter = 'netz';
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
    if (!t) return;
    if (!t.vis() && id !== 'optionen') return;   // Optionen liegen hinter dem Menü
    if (id !== 'optionen') vorherigerReiter = id;
    active = id;
    if (!S.seenTabs.includes(id)) S.seenTabs.push(id);
    const dot = t.el.querySelector('.dot'); if (dot) dot.remove();
    TABS.forEach(x => x.el.classList.toggle('active', x.id === id));
    U.$$('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === id));
    if (!built[id]) { build(id); built[id] = true; }
    refreshTab(true);
    if (id === 'baum') { refreshTree(); fitTree(); }
  }

  function panel(id) { return U.$(`.tab-panel[data-tab="${id}"]`); }

  function build(id) {
    ({ netz: buildNetz, baum: buildBaum, sporen: buildSporen, symbiose: buildSym,
       erfolge: buildErfolge, statistik: buildStat, optionen: buildOpt }[id] || (() => {}))();
  }

  /* ================= REITER: NETZ ================= */
  function buildNetz() {
    const p = panel('netz');
    p.innerHTML = `
      <div class="goalbar" id="goalbar"></div>
      <div class="click-zone">
        <div class="orb-wrap" id="orb-wrap">
          <svg class="orb-ring" viewBox="-110 -110 220 220" aria-hidden="true">
            <g id="orb-hyphen"></g>
            <circle class="or-bg" r="92"></circle>
            <circle class="or-fill" id="or-fill" r="92"></circle>
          </svg>
          <button class="big-click" id="bigclick">
            <span class="bc-lbl">Nähren</span>
            <span class="bc-val" id="bc-val">+1</span>
          </button>
        </div>
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

  /* Der Kern zeigt den Fortschritt: Der Ring fuellt sich bis zum naechsten
     Reifegrad, der Orb wird groesser und heller, und alle fuenf Reifegrade
     waechst eine weitere Hyphe aus ihm heraus. */
  const ORB_UMFANG = 2 * Math.PI * 92;
  let orbHyphen = -1;

  function orbAktualisieren() {
    const fill = U.$('#or-fill');
    if (!fill) return;
    const p = E.levelProgress();
    const off = (ORB_UMFANG * (1 - p)).toFixed(1);
    if (fill.getAttribute('stroke-dashoffset') !== off) {
      fill.setAttribute('stroke-dasharray', ORB_UMFANG.toFixed(1));
      fill.setAttribute('stroke-dashoffset', off);
    }
    // Groesse und Leuchtkraft steigen mit dem Reifegrad, aber gedeckelt
    const reife = U.clamp(S.level / 60, 0, 1);
    const wrap = U.$('#orb-wrap');
    if (wrap && wrap.dataset.reife !== reife.toFixed(2)) {
      wrap.dataset.reife = reife.toFixed(2);
      wrap.style.setProperty('--reife', reife.toFixed(3));
    }
    // Hyphen: eine je fuenf Reifegrade, hoechstens sechzehn
    const anzahl = Math.min(16, Math.floor(S.level / 5));
    if (anzahl !== orbHyphen) {
      orbHyphen = anzahl;
      const g = U.$('#orb-hyphen');
      g.innerHTML = '';
      for (let i = 0; i < anzahl; i++) {
        const a = (i / anzahl) * Math.PI * 2 - Math.PI / 2;
        const r1 = 94, r2 = 104 + (i % 3) * 5;
        const l = U.svgEl('line', {
          x1: (Math.cos(a) * r1).toFixed(1), y1: (Math.sin(a) * r1).toFixed(1),
          x2: (Math.cos(a) * r2).toFixed(1), y2: (Math.sin(a) * r2).toFixed(1),
          class: 'or-hyphe'
        });
        l.style.animationDelay = (i * 0.09).toFixed(2) + 's';
        g.appendChild(l);
      }
    }
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
    orbAktualisieren();
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
  const weaveEls = [];
  const segEls = {};
  const tagEls = {};
  const tagGrp = {};

  function buildBaum() {
    const p = panel('baum');
    p.innerHTML = `
      <div class="tree-wrap" id="treewrap">
        <svg id="tree-svg"><g id="tree-g"></g></svg>
        <div class="tree-hud">
          <div class="wp-box"><div class="n" id="wp-n">0</div><div class="l">Wachstumspunkte</div></div>
        </div>
      </div>`;
    const g = U.$('#tree-g');
    R.treeG = g; R.treeWrap = U.$('#treewrap');

    /* Eingefaerbtes Kreissegment je Ast. Ohne das sieht der Baum aus wie
       ein einziges Geflecht - mit ihm ist sofort klar, was wozu gehoert. */
    const defs = U.svgEl('defs');
    Object.keys(D.BRANCHES).forEach(k => {
      const b = D.BRANCHES[k];
      const grad = U.svgEl('radialGradient', { id: 'seg-' + k });
      const s1 = U.svgEl('stop', { offset: '0%', 'stop-color': b.col, 'stop-opacity': '0.10' });
      const s2 = U.svgEl('stop', { offset: '40%', 'stop-color': b.col, 'stop-opacity': '0.045' });
      const s3 = U.svgEl('stop', { offset: '80%', 'stop-color': b.col, 'stop-opacity': '0' });
      grad.appendChild(s1); grad.appendChild(s2); grad.appendChild(s3);
      defs.appendChild(grad);
    });
    g.appendChild(defs);

    const RAUS = 880;                       // Reichweite der Segmente
    const halb = (D.SEKTOR / 2 - 2) * Math.PI / 180;   // Luecke zwischen den Aesten
    Object.keys(D.BRANCHES).forEach(k => {
      const b = D.BRANCHES[k];
      const m = b.ang * Math.PI / 180;
      const x1 = Math.cos(m - halb) * RAUS, y1 = Math.sin(m - halb) * RAUS;
      const x2 = Math.cos(m + halb) * RAUS, y2 = Math.sin(m + halb) * RAUS;
      const seg = U.svgEl('path', { class: 'branch-seg',
        d: `M0 0 L${x1} ${y1} A${RAUS} ${RAUS} 0 0 1 ${x2} ${y2} Z`,
        fill: 'url(#seg-' + k + ')' });
      seg.dataset.branch = k;
      seg.style.transformOrigin = '0px 0px';   // waechst vom Kern nach aussen
      g.appendChild(seg);
      segEls[k] = seg;
    });

    // Sanfte Hoehenlinien als Orientierung
    for (let r = 1; r <= 9; r++) {
      g.appendChild(U.svgEl('circle', { class: 'ring-guide', cx: 0, cy: 0, r: 120 + r * 82 }));
    }

    // Ast-Beschriftung mit Zeichen, aussen in Richtung des Astes
    for (const k in D.BRANCHES) {
      const b = D.BRANCHES[k];
      const tip = D.branchTip(k);
      const a = tip.ang * Math.PI / 180, rad = tip.rad + 62;
      const gr = U.svgEl('g', { class: 'branch-tag', transform: `translate(${Math.cos(a) * rad},${Math.sin(a) * rad})` });
      const ic = U.svgEl('text', { class: 'bt-ic', y: -14, fill: b.col });
      ic.textContent = b.ic; gr.appendChild(ic);
      const t = U.svgEl('text', { class: 'branch-label', y: 8, fill: b.col });
      t.textContent = b.name; gr.appendChild(t);
      const zw = U.svgEl('text', { class: 'branch-zweck', y: 25, fill: b.col });
      zw.textContent = b.zweck; gr.appendChild(zw);
      const z = U.svgEl('text', { class: 'branch-count', y: 42, fill: b.col });
      gr.appendChild(z);
      g.appendChild(gr);
      tagEls[k] = z;
      tagGrp[k] = gr;
    }

    /* Verbindungen: jeder Ast hat seine eigene Wegform - eine geschwungene
       Ader beim Wachstum, rechte Winkel bei der Effizienz, zwei Straenge bei
       der Symbiose, Schienen bei der Automatik und so fort. Farbe allein
       reicht nicht, um Kategorien auseinanderzuhalten. */
    D.NODES.forEach(n => {
      if (!n.req) return;
      const br = D.BRANCHES[n.b];
      const a = D.nodePos(D.NODE_BY_ID[n.req]), b = D.nodePos(n);
      const teile = D.wegForm(br.form, a, b, (n.id.charCodeAt(2) % 7) / 7);
      const gruppe = U.svgEl('g', { class: 'tlink off' });
      gruppe.style.setProperty('--lc', br.col);
      teile.forEach(t => {
        const l = U.svgEl('path', { class: 'lp ' + (t.klasse || ''), d: t.d,
          'stroke-width': t.klasse === 'duenn' ? 1.5 : Math.max(1.7, 4.2 - n.ring * 0.24) });
        gruppe.appendChild(l);
      });
      g.appendChild(gruppe);
      linkEls[n.id] = gruppe;
    });

    // Verwebungen zwischen benachbarten Aesten - leuchten erst auf,
    // wenn beide Enden gekauft sind
    D.WEAVES.forEach(([x, y], i) => {
      const na = D.NODE_BY_ID[x], nb = D.NODE_BY_ID[y];
      if (!na || !nb) return;
      const a = D.nodePos(na), b = D.nodePos(nb);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const w = U.svgEl('path', { class: 'tweave',
        d: `M${a.x} ${a.y} Q${mx * 0.72} ${my * 0.72} ${b.x} ${b.y}` });
      w.style.setProperty('--wa', D.BRANCHES[na.b].col);
      g.insertBefore(w, g.firstChild);
      weaveEls.push({ el: w, a: x, b: y });
    });

    // Kern
    const core = U.svgEl('g', { class: 'tcore' });
    core.appendChild(U.svgEl('circle', { r: 34, fill: 'rgba(79,224,160,.08)', stroke: 'rgba(79,224,160,.35)', 'stroke-width': 1.5 }));
    core.appendChild(U.svgEl('circle', { r: 22, fill: 'rgba(79,224,160,.14)', stroke: 'rgba(79,224,160,.6)', 'stroke-width': 2 }));
    core.appendChild(U.svgEl('circle', { r: 13, fill: 'rgba(79,224,160,.9)' }));
    const ct = U.svgEl('text', { class: 'ic', y: 1, 'font-size': 15, fill: '#04140d' });
    ct.textContent = '\u274b'; core.appendChild(ct);
    g.appendChild(core);

    // Verbindung Kern -> erste Knoten, ebenfalls in der Form des Astes
    D.NODES.filter(n => !n.req).forEach(n => {
      const br = D.BRANCHES[n.b];
      const gruppe = U.svgEl('g', { class: 'tlink on' });
      gruppe.style.setProperty('--lc', br.col);
      D.wegForm(br.form, { x: 0, y: 0 }, D.nodePos(n)).forEach(t => {
        gruppe.appendChild(U.svgEl('path', { class: 'lp ' + (t.klasse || ''), d: t.d,
          'stroke-width': t.klasse === 'duenn' ? 1.5 : 4.2 }));
      });
      g.insertBefore(gruppe, g.firstChild);
    });

    // Knoten
    D.NODES.forEach(n => {
      const pos = D.nodePos(n);
      const el = U.svgEl('g', { class: 'tnode' + (n.max === 1 ? ' key' : ''), transform: `translate(${pos.x},${pos.y})` });
      el.style.setProperty('--nc', D.BRANCHES[n.b].col);
      const r = n.max === 1 ? 25 : 21;
      if (n.max === 1) el.appendChild(U.svgEl('circle', { class: 'halo', r: r + 8 }));
      const kf = D.kopfForm(D.BRANCHES[n.b].kopf, r);
      const form = U.svgEl(kf.tag, kf.attr);
      form.setAttribute('class', 'bg');
      el.appendChild(form);
      const t = U.svgEl('text', { class: 'ic' }); t.textContent = n.ic;
      el.appendChild(t);
      const lv = U.svgEl('text', { class: 'lvl', y: r + 15 });
      el.appendChild(lv);
      el.addEventListener('click', ev => { ev.stopPropagation(); if (dragged) return; selectNode(n.id); });
      g.appendChild(el);
      nodeEls[n.id] = { el, lv, n };
    });

    // Legende


    // Steuerung
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

    /* Touch: zwei Finger zum Zoomen, Doppeltipp setzt die Ansicht zurueck.
       Ohne das laesst sich der Baum auf Tablets nur ueber die kleinen
       Plus/Minus-Knoepfe skalieren. */
    let pinch = null;
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = t => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
    R.treeWrap.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        drag = null;
        R.treeWrap.classList.remove('dragging');
        pinch = { d: dist(e.touches), z: view.z, m: mid(e.touches) };
      }
    }, { passive: true });
    R.treeWrap.addEventListener('touchmove', e => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        const f = dist(e.touches) / pinch.d;
        const m = mid(e.touches);
        const nz = U.clamp(pinch.z * f, 0.3, 2.4);
        const k = nz / view.z;
        view.x = m[0] - (m[0] - view.x) * k;
        view.y = m[1] - (m[1] - view.y) * k;
        view.z = nz;
        applyView();
      }
    }, { passive: false });
    const endPinch = e => { if (e.touches.length < 2) { pinch = null; dragged = true; setTimeout(() => { dragged = false; }, 60); } };
    R.treeWrap.addEventListener('touchend', endPinch);
    R.treeWrap.addEventListener('touchcancel', endPinch);

    let lastTap = 0;
    R.treeWrap.addEventListener('touchend', e => {
      if (e.touches.length) return;
      const now = Date.now();
      if (now - lastTap < 320 && !e.target.closest('.tnode') && !e.target.closest('.tree-hud')) fitTree();
      lastTap = now;
    });

    fitTree();
  }

  /** Hebt einen Ast hervor, waehrend die Maus auf der Legende steht. */
  function hebeAst(k, an) {
    for (const id in nodeEls) {
      nodeEls[id].el.classList.toggle('gedimmt', an && nodeEls[id].n.b !== k);
    }
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
  /** Passt die Ansicht so ein, dass alles Sichtbare hineinpasst - inklusive
      der Ast-Beschriftungen. Waechst der Baum, zoomt die Ansicht heraus. */
  function fitTree() {
    if (!R.treeWrap) return;
    const r = R.treeWrap.getBoundingClientRect();
    if (!r.width) return;
    let minX = -160, maxX = 160, minY = -160, maxY = 160;
    D.NODES.forEach(n => {
      if (!sichtbar(n.id)) return;
      const p = D.nodePos(n);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    // Rand fuer Knotenbeschriftung und die dreizeiligen Ast-Ueberschriften
    const rand = 185;
    minX -= rand; maxX += rand; minY -= rand; maxY += rand;
    const bw = maxX - minX, bh = maxY - minY;
    view.z = U.clamp(Math.min(r.width / bw, r.height / bh), 0.22, 1.5);
    view.x = r.width / 2 - ((minX + maxX) / 2) * view.z;
    view.y = r.height / 2 - ((minY + maxY) / 2) * view.z;
    applyView();
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

  let panelSig = '';        // Auswahl + Stufe: nur dabei wird neu gebaut

  function renderNodePanel(force) {
    let p = U.$('.node-panel');
    if (!selNode) { if (p) p.remove(); panelSig = ''; return; }
    const st = E.nodeState(selNode), n = st.n, br = D.BRANCHES[n.b];
    const sig = selNode + ':' + st.lv;

    if (!p || sig !== panelSig || force) {
      panelSig = sig;
      if (!p) { p = U.el('div', 'node-panel'); R.treeWrap.appendChild(p); }
      p.innerHTML = `
        <button class="np-close" title="Schließen">×</button>
        <div class="np-branch" style="color:${br.col}">${br.ic} ${br.name}${n.max === 1 ? ' · Schlüsselknoten' : ''}</div>
        <h3>${n.ic} ${n.name}</h3>
        <div class="np-lv">Stufe ${st.lv} / ${n.max}</div>
        ${st.lv > 0 ? `<div class="np-eff"><div class="k">Aktuell</div><div class="v">${n.d(st.lv)}</div></div>` : ''}
        ${!st.maxed ? `<div class="np-eff next"><div class="k">Nach dem Kauf</div><div class="v">${n.d(st.lv + 1)}</div></div>` : ''}
        ${st.maxed ? '<div class="np-cost">Voll ausgebaut.</div>'
          : `<div class="np-cost">Kosten: <b>${U.fmtInt(st.cost)}</b> Wachstumspunkte<br>
             <span style="font-size:12px">Verfügbar: <span id="np-frei"></span></span></div>`}
        <div class="np-req" id="np-req"></div>
        ${st.maxed ? '' : '<button class="btn" id="np-buy" style="width:100%;margin-top:6px">Ausbauen</button>'}`;
      p.querySelector('.np-close').onclick = closePanel;
      const b = p.querySelector('#np-buy');
      if (b) b.onclick = () => {
        if (E.buyNode(selNode)) {
          FX.sfx.node();
          ripple(selNode);
          renderNodePanel(true); refreshTree(); refreshTop();
        } else FX.sfx.err();
      };
      R.npFrei = p.querySelector('#np-frei');
      R.npReq = p.querySelector('#np-req');
      R.npBuy = b;
    }
    refreshNodePanel(st, n);
  }

  /** Nur die Werte, die sich laufend ändern - ohne das Fenster neu zu bauen. */
  function refreshNodePanel(st, n) {
    if (!selNode || !R.npReq) return;
    st = st || E.nodeState(selNode);
    n = n || st.n;
    const frei = E.wpAvail();
    if (R.npFrei) setText(R.npFrei, U.fmtInt(frei));

    let hinweis = '';
    if (st.gated) hinweis = st.grund;
    else if (!st.parentOk) hinweis = `Zuerst nötig: <b>${D.NODE_BY_ID[n.req].name}</b>`;
    else if (!st.maxed && frei < st.cost) hinweis = `Noch ${U.fmtInt(st.cost - frei)} Wachstumspunkt${st.cost - frei === 1 ? '' : 'e'} nötig.`;
    setHTML(R.npReq, hinweis);
    R.npReq.classList.toggle('hidden', !hinweis);

    if (R.npBuy) {
      R.npBuy.disabled = !st.canBuy;
      R.npBuy.classList.toggle('btn-primary', st.canBuy);
    }
  }

  function ripple(id) {
    const pos = D.nodePos(D.NODE_BY_ID[id]);
    const c = U.svgEl('circle', { class: 'ripple', cx: pos.x, cy: pos.y, r: 22,
      stroke: D.BRANCHES[D.NODE_BY_ID[id].b].col });
    c.style.transformOrigin = `${pos.x}px ${pos.y}px`;
    R.treeG.appendChild(c);
    setTimeout(() => c.remove(), 950);
  }

  /** Sichtbar ist, was gekauft wurde, und was unmittelbar daran anschliesst.
      Alles weiter aussen bleibt im Dunkeln - so waechst der Baum wirklich
      mit, statt von Anfang an fertig dazustehen. */
  function sichtbar(id) {
    const n = D.NODE_BY_ID[id];
    if ((S.nodes[id] || 0) > 0) return true;              // selbst gekauft
    if (!n.req) return true;                              // erster Knoten eines Astes
    return (S.nodes[n.req] || 0) > 0;                     // Elternknoten gekauft
  }

  function refreshTree() {
    if (!built.baum) return;
    U.$('#wp-n').textContent = U.fmtInt(E.wpAvail());
    for (const id in nodeEls) {
      const { el, lv, n } = nodeEls[id];
      const zeig = sichtbar(id);
      el.classList.toggle('verborgen', !zeig);
      const link = linkEls[id];
      if (link) link.classList.toggle('verborgen', !zeig);
      if (!zeig) continue;
      const st = E.nodeState(id);
      el.classList.toggle('locked', st.gated || !st.parentOk);
      el.classList.toggle('avail', !st.gated && st.parentOk);
      el.classList.toggle('owned', st.lv > 0);
      el.classList.toggle('maxed', st.maxed);
      el.classList.toggle('can', st.canBuy);
      el.classList.toggle('sel', selNode === id);
      lv.textContent = st.lv > 0 ? (st.maxed ? 'MAX' : st.lv + '/' + n.max) : (st.gated ? '🔒' : '');
      if (link) { link.classList.toggle('on', st.lv > 0); link.classList.toggle('off', st.lv === 0); }
    }
    weaveEls.forEach(w => {
      w.el.classList.toggle('on', (S.nodes[w.a] || 0) > 0 && (S.nodes[w.b] || 0) > 0);
    });
    /* Jeder Ast waechst nach aussen, so weit er ausgebaut ist. Ein Ast ohne
       Investition ist nur ein Ansatz am Kern. */
    for (const k in segEls) {
      const inf = D.branchInfo(k, S.nodes);
      const weite = U.clamp((inf.tiefste + 120) / 880, 0.17, 1);
      const sk = 'scale(' + weite.toFixed(3) + ')';
      if (segEls[k].style.transform !== sk) segEls[k].style.transform = sk;
      if (tagEls[k]) setText(tagEls[k], inf.stufen + ' / ' + inf.moeglich);
      /* Die Beschriftung sitzt immer knapp hinter dem aeussersten sichtbaren
         Knoten des Astes - sonst schwebt sie weit weg im Leeren. */
      if (tagGrp[k]) {
        let weit = 150;
        D.NODES.forEach(n => {
          if (n.b !== k || !sichtbar(n.id)) return;
          const pp = D.nodePos(n);
          if (pp.rad > weit) weit = pp.rad;
        });
        const a = D.BRANCHES[k].ang * Math.PI / 180, rad = weit + 92;
        const tr = `translate(${(Math.cos(a) * rad).toFixed(0)},${(Math.sin(a) * rad).toFixed(0)})`;
        if (tagGrp[k].getAttribute('transform') !== tr) tagGrp[k].setAttribute('transform', tr);
      }
    }
    if (selNode) renderNodePanel();     // neue Punkte schalten den Knopf sofort frei
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
      <p class="hint">Bleiben für immer. Ausgeben kostet Sporen — der Produktions-Bonus aus deinen
        <b>insgesamt gesammelten</b> Sporen bleibt davon unberührt.</p>
      <div id="muts"></div>`;

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
    ['produktion', 'sporen', 'komfort'].forEach(g => {
      const [titel, was] = D.GRUPPEN_NAME[g];
      const kopf = U.el('div', 'mut-gruppe', `<div class="mg-titel">${titel}</div><div class="mg-was">${was}</div>`);
      R.mutGrid.appendChild(kopf);
      const raster = U.el('div', 'card-grid');
      D.MUTATIONS.filter(m => m.gruppe === g).forEach(mu => {
        const c = U.el('div', 'card mut');
        c.innerHTML = `<h4>${mu.ic} ${mu.name} <span class="lvl" data-lv></span></h4>
          <p data-d></p>
          <button class="cbtn" data-buy><span data-btxt>Mutieren</span> <b data-cost></b></button>`;
        c.querySelector('[data-buy]').onclick = ev => {
          if (E.buyMut(mu.id)) {
            FX.sfx.node(); FX.burst(ev.clientX, ev.clientY, '#f7c948', 12, 3); refreshSporen(); refreshTop();
          } else FX.sfx.err();
        };
        R.mutCards.push({ c, mu, lv: c.querySelector('[data-lv]'), d: c.querySelector('[data-d]'),
          cost: c.querySelector('[data-cost]'), btxt: c.querySelector('[data-btxt]'),
          btn: c.querySelector('[data-buy]') });
        raster.appendChild(c);
      });
      R.mutGrid.appendChild(raster);
    });
  }

  function refreshSporen() {
    if (!built.sporen) return;
    const g = E.sporeGain();
    const mult = E.sporeMult(S.sporeLife);
    setText(R.spGain, U.fmtInt(g));
    const nextAt = Math.pow((g + 1) / Math.max(1e-9, E.m.spore), 1 / (0.35 + E.m.sporeExp)) * 1e9;
    setHTML(R.spSub, `Biomasse und Strukturen gehen verloren, alles andere bleibt.
      Gesammelte Sporen geben dauerhaft <b>${U.fmtMul(mult)}</b> Produktion.`);
    setW(R.spBar, E.sporeProgress() * 100);

    const can = g > 0;
    R.spBtn.classList.toggle('btn-primary', can);
    R.spBtn.disabled = !can;
    setText(R.spBtn, g > 0 ? `Sporenflug — ${U.fmtInt(g)} Sporen`
      : `Noch ${U.fmt(Math.max(0, 1e9 - S.runTotal))} Biomasse nötig`);

    setHTML(R.spStats, `
      <div>Sporen verfügbar<b>${U.fmtInt(S.sporen)}</b></div>
      <div>gesammelt<b>${U.fmtInt(S.sporeLife)}</b></div>
      <div>Sporenflüge<b>${U.fmtInt(S.prestiges)}</b></div>`);

    R.spAuto.classList.toggle('hidden', !E.m.autoPrestige);
    R.apSw.classList.toggle('on', S.autoPrestigeOn);
    if (document.activeElement !== R.apAt && String(R.apAt.value) !== String(S.autoPrestigeAt)) {
      R.apAt.value = S.autoPrestigeAt;
    }

    R.mutCards.forEach(m => {
      const st = E.mutState(m.mu.id);
      m.c.classList.toggle('can', st.canBuy);
      m.c.classList.toggle('maxed', st.maxed);
      setText(m.lv, st.lv + ' / ' + m.mu.max);
      setHTML(m.d, m.mu.d(st.maxed ? st.lv : st.lv + 1));
      setText(m.cost, st.maxed ? '' : U.fmtInt(st.cost));
      m.btn.disabled = !st.canBuy;
      setText(m.btxt, st.maxed ? 'Voll ausgebaut' : st.lv > 0 ? 'Weiter' : 'Mutieren');
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

    const can = g > 0;
    R.syBtn.classList.toggle('btn-primary', can);
    R.syBtn.disabled = !can;
    setText(R.syBtn, g > 0 ? `Symbiose eingehen — ${U.fmtInt(g)} Punkte`
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
    panel('statistik').innerHTML = `
      <h2 class="sec">Bestenliste</h2>
      <p class="hint" id="lb-info">Sortiert nach Reifegrad, bei Gleichstand nach der gesamten
        Biomasse. Zeile antippen für Einzelheiten.</p>
      <div class="lb-list" id="lb-box"><p style="opacity:.6">Wird geladen …</p></div>
      <div class="lb-knoepfe">
        <button class="btn sm" id="lb-mehr">Ganze Liste</button>
        <button class="btn sm ghost" id="lb-neu">Neu laden</button>
      </div>
      <h2 class="sec" style="margin-top:32px">Dein Myzel</h2>
      <div id="stats"></div>`;
    R.statGrid = U.$('#stats');
    R.lbBox = U.$('#lb-box');
    R.lbAlle = false;
    U.$('#lb-neu').onclick = () => ladeBestenliste(true);
    U.$('#lb-mehr').onclick = () => {
      R.lbAlle = !R.lbAlle;
      setText(U.$('#lb-mehr'), R.lbAlle ? 'Nur die besten drei' : 'Ganze Liste');
      ladeBestenliste();
    };
    ladeBestenliste();
  }

  /* Vier Gruppen statt achtzehn gleichrangiger Kacheln - so ist auf einen
     Blick klar, was zusammengehört. */
  function statGruppen() {
    return [
      ['Gerade eben', [
        ['Biomasse', U.fmt(S.biomass)],
        ['Produktion', U.fmt(E.total) + ' /s'],
        ['Multiplikator', U.fmtMul(E.m.global) + (E.m.global >= E.softcap.at ? ' (gedämpft)' : '')],
        ['Strukturen', U.fmtInt(E.structsTotal())]
      ]],
      ['Insgesamt', [
        ['Reifegrad', S.level],
        ['Biomasse gesamt', U.fmt(S.lifetime)],
        ['Beste Produktion', U.fmt(S.stats.bestRate) + ' /s'],
        ['Spielzeit', U.fmtTime(S.playTime)]
      ]],
      ['Skillbaum und Sporen', [
        ['Wachstumspunkte', `${U.fmtInt(E.wpAvail())} frei / ${U.fmtInt(E.wpTotal())}`],
        ['Skill-Stufen', U.fmtInt(E.nodeLevelSum())],
        ['Sporen gesammelt', U.fmtInt(S.sporeLife)],
        ['Sporenflüge', U.fmtInt(S.prestiges)],
        ['Symbiose-Punkte', U.fmtInt(S.spLife)],
        ['Biome', `${S.biomes.length} / ${D.BIOMES.length}`]
      ]],
      ['Nebenbei', [
        ['Erfolge', `${S.ach.length} / ${D.ACH.length}`],
        ['Klicks', U.fmtInt(S.stats.clicks)],
        ['Goldene Sporen', U.fmtInt(S.stats.golds)],
        ['Begonnen am', new Date(S.stats.started).toLocaleDateString('de-DE')]
      ]]
    ];
  }

  function refreshStat() {
    if (!built.statistik) return;
    const gruppen = statGruppen();
    if (!R.statCells) {
      R.statGrid.innerHTML = gruppen.map(([titel, zeilen]) => `
        <div class="stat-gruppe"><div class="sg-titel">${titel}</div>
          <div class="stat-grid">${zeilen.map(z =>
            `<div class="stat-card"><div class="sl">${z[0]}</div><div class="sv"></div></div>`).join('')}
          </div></div>`).join('');
      R.statCells = U.$$('.sv', R.statGrid);
    }
    let i = 0;
    gruppen.forEach(([, zeilen]) => zeilen.forEach(z => setText(R.statCells[i++], z[1])));
  }

  /** Bestenliste in den Statistik-Reiter zeichnen. */
  async function ladeBestenliste(neuLaden) {
    if (!R.lbBox) return;
    if (neuLaden) setHTML(R.lbBox, '<p style="opacity:.6">Wird geladen …</p>');
    const { list, online } = await LB.fetchList();
    if (!R.lbBox) return;
    const meine = (S && S.pid) || '';
    if (!list.length) {
      setHTML(R.lbBox, '<p style="opacity:.6">Noch keine Einträge. Sei der erste.</p>');
      return;
    }
    setHTML(U.$('#lb-info'), online
      ? 'Sortiert nach Reifegrad, bei Gleichstand nach der gesamten Biomasse. Zeile antippen für Einzelheiten.'
      : 'Gerade nicht erreichbar — hier steht der zuletzt geladene Stand.');
    R.lbBox.innerHTML = list.slice(0, R.lbAlle ? 25 : 3).map((e, i) => `
      <div class="lb-row ${i === 0 ? 'top1' : ''} ${e.id && e.id === meine ? 'me' : ''}" data-i="${i}">
        <span class="r">${i + 1}</span><span class="n">${Game.escape(e.name)}</span>
        <span class="lbv">Reifegrad <b>${e.level}</b></span><span class="lb-more">▾</span>
      </div><div class="lb-detail" data-d="${i}"></div>`).join('');
    U.$$('.lb-row', R.lbBox).forEach(row => {
      row.onclick = () => {
        const i = +row.dataset.i, e = list[i];
        const d = U.$(`.lb-detail[data-d="${i}"]`, R.lbBox);
        const offen = d.classList.toggle('on');
        row.classList.toggle('open', offen);
        if (offen && !d.innerHTML) d.innerHTML = Game.lbDetail(e);
      };
    });
  }

  /* ================= REITER: OPTIONEN ================= */
  function buildOpt() {
    const p = panel('optionen');
    p.innerHTML = `
      <button class="btn sm zurueck" id="opt-back">← Zurück zum Menü</button>
      <h2 class="sec">Einstellungen</h2>
      <div id="opts"></div>
      <h2 class="sec" style="margin-top:26px">Spielstand</h2>
      <div class="opt-row">
        <div><div class="ol"><i class="dot-ok"></i>Wird automatisch gespeichert</div>
          <div class="od">Alle paar Sekunden und beim Verlassen der Seite.
            <span id="sv-when"></span></div></div>
      </div>
      <div class="opt-row">
        <div><div class="ol">Sicherung</div>
          <div class="od">Für den Umzug auf ein anderes Gerät oder als Reservekopie.</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn sm" id="sv-file">Sicherung speichern</button>
          <button class="btn sm" id="sv-load">Sicherung laden</button>
        </div>
      </div>
      <div class="opt-row" style="margin-top:16px;border-color:rgba(239,107,107,.3)">
        <div><div class="ol">Neu beginnen</div>
          <div class="od">Löscht diesen Spielstand vollständig und startet ein neues Myzel.
            Exportiere vorher, wenn du ihn behalten willst.</div></div>
        <button class="btn btn-danger sm" id="sv-reset">Alles zurücksetzen</button>
      </div>
      <h2 class="sec" style="margin-top:26px">Tasten</h2>
      <div class="hint" id="keys"></div>
      <div class="hint" style="opacity:.6;margin-top:20px">MYZEL — Das stille Netz · v1.0</div>`;

    U.$('#opt-back').onclick = () => Game.zumMenue();
    const opts = U.$('#opts');
    const rows = [
      ['particles', 'Partikel', 'Sporen und Funken. Ausschalten spart Leistung.'],
      ['ticker', 'Waldmeldungen', 'Kleine Textzeilen unter den Strukturen.'],
      ['offline', 'Offline-Wachstum', 'Rechnet Zeit an, in der das Spiel geschlossen war.'],
      ['confirmPrestige', 'Nachfrage vor Reset', 'Fragt vor Sporenflug und Symbiose nach.'],
      ['autoBoard', 'Bestenliste aktuell halten', 'Trägt deinen Stand von selbst ein, höchstens alle 90 Sekunden.']
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
    const kr = U.el('div', 'opt-row', `<div><div class="ol">Klänge</div>
      <div class="od">Kurze Töne bei Klicks, Käufen und Erfolgen.</div></div>
      <div style="display:flex;gap:12px;align-items:center">
        <input type="range" id="sfx-vol" min="0" max="100" step="1" value="${Math.round(S.opt.sfxVol * 100)}">
        <span class="switch ${S.opt.sound ? 'on' : ''}" id="sfx-sw"></span>
      </div>`);
    U.$('#sfx-sw', kr).onclick = e => {
      S.opt.sound = !S.opt.sound; e.target.classList.toggle('on', S.opt.sound);
      refreshTop(); if (S.opt.sound) FX.sfx.click();
    };
    U.$('#sfx-vol', kr).oninput = e => { S.opt.sfxVol = +e.target.value / 100; FX.sfx.click(); };
    opts.appendChild(kr);

    const mr = U.el('div', 'opt-row', `<div><div class="ol">Musik</div>
      <div class="od">Ein ruhiger Klangteppich, der live erzeugt wird — er wiederholt sich nie.</div></div>
      <div style="display:flex;gap:12px;align-items:center">
        <input type="range" id="mus-vol" min="0" max="100" step="1" value="${Math.round(S.opt.musicVol * 100)}">
        <span class="switch ${S.opt.music ? 'on' : ''}" id="mus-sw"></span>
      </div>`);
    U.$('#mus-sw', mr).onclick = e => { e.target.classList.toggle('on', Music.umschalten()); refreshTop(); };
    U.$('#mus-vol', mr).oninput = e => { S.opt.musicVol = +e.target.value / 100; Music.lautstaerke(S.opt.musicVol); };
    opts.appendChild(mr);

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

    U.$('#sv-file').onclick = () => {
      Save.write();
      const blob = new Blob([Save.exportStr()], { type: 'text/plain' });
      const a = U.el('a'); a.href = URL.createObjectURL(blob);
      a.download = 'myzel-spielstand-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      FX.toast('Sicherung gespeichert', 'Die Datei liegt in deinen Downloads.', 'lime');
    };
    U.$('#sv-load').onclick = () => Game.ladeSicherung();
    U.$('#sv-reset').onclick = () => {
      Game.confirm('Wirklich alles zurücksetzen?', 'Reifegrad, Skillbaum, Sporen und Biome sind dann weg. Das lässt sich nicht rückgängig machen.', () => {
        Save.wipe(); location.reload();
      }, 'Alles löschen');
    };
    U.$('#keys').innerHTML = `
      <b>1 – 8</b> Struktur kaufen &nbsp;·&nbsp; <b>M</b> alle kaufbaren Strukturen kaufen &nbsp;·&nbsp;
      <b>Leertaste</b> nähren &nbsp;·&nbsp; <b>P</b> Sporenflug &nbsp;·&nbsp; <b>S</b> Symbiose`;
  }

  function refreshOpt() {
    if (!built.optionen) return;
    const e = U.$('#sv-when');
    if (!e || !S.lastSave) return;
    const sek = Math.max(0, (Date.now() - S.lastSave) / 1000);
    setText(e, sek < 3 ? 'Gerade eben gesichert.' : 'Zuletzt vor ' + U.fmtTimeShort(sek) + '.');
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
    U.$('#btn-music').classList.toggle('off', !S.opt.music);
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
       erfolge: refreshErfolge, statistik: refreshStat,
       optionen: refreshOpt }[active] || (() => {}))();
  }
  function refreshAll() {
    refreshTop(); refreshTabs(); refreshTab(true);
  }

  return { initTabs, show, refreshTop, refreshTab, refreshAll, refreshTabs, refreshTree, pulse, fitTree,
    get active() { return active; } };
})();
