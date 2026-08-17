/* ============================================================
   MYZEL - main.js
   Startbildschirm, Spielschleife, Modale, Tasten
   ============================================================ */
const Game = (() => {

  let last = 0, uiAcc = 0, saveAcc = 0, running = false;

  /* ================= Modale ================= */
  function modal(html, onOpen) {
    const root = U.$('#modal-root');
    root.innerHTML = `<div class="modal">${html}</div>`;
    root.classList.add('on');
    root.onclick = e => { if (e.target === root) close(); };
    if (onOpen) onOpen(U.$('.modal', root));
    return root;
  }
  function close() { U.$('#modal-root').classList.remove('on'); U.$('#modal-root').innerHTML = ''; }

  function confirmBox(title, text, cb, okLabel, danger) {
    modal(`<h3>${title}</h3><p>${text}</p>
      <div class="mrow"><button class="btn ghost" id="m-no">Abbrechen</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="m-yes">${okLabel || 'Ja, weiter'}</button></div>`,
      m => {
        U.$('#m-no', m).onclick = close;
        U.$('#m-yes', m).onclick = () => { close(); cb(); };
      });
  }

  /* ================= Startbildschirm ================= */
  function initStart() {
    zeichnePlaetze();
    U.$('#btn-board-start').onclick = () => showLeaderboard(true);
    U.$('#btn-about').onclick = showAbout;
  }

  /** Die drei Plätze als Liste - belegte zum Weiterspielen, leere zum Anlegen. */
  function zeichnePlaetze() {
    const box = U.$('#slot-list');
    const plaetze = Save.slots();
    box.innerHTML = '';
    plaetze.forEach(pl => {
      const row = U.el('div', 'slot' + (pl.leer ? ' leer' : ''));
      if (pl.leer) {
        row.innerHTML = `<div class="slot-main">
            <div class="slot-name">Platz ${pl.nr} — frei</div>
            <div class="slot-sub">Hier ein neues Myzel anlegen</div>
          </div><div class="slot-go">+</div>`;
        row.onclick = () => neuesMyzel(pl.nr);
      } else {
        const her = pl.lastSave ? U.fmtTimeShort((Date.now() - pl.lastSave) / 1000) : '?';
        row.innerHTML = `<div class="slot-main">
            <div class="slot-name">${escapeHtml(pl.name)}</div>
            <div class="slot-sub">Reifegrad <b>${pl.level}</b> · ${U.fmt(pl.lifetime)} Biomasse
              · ${U.fmtTimeShort(pl.playTime)} gespielt · vor ${her}</div>
          </div>
          <button class="slot-del" title="Diesen Platz löschen">×</button>
          <div class="slot-go">▸</div>`;
        row.onclick = ev => {
          if (ev.target.closest('.slot-del')) return;
          if (Save.load(pl.nr)) enter(false);
        };
        row.querySelector('.slot-del').onclick = ev => {
          ev.stopPropagation();
          confirmBox('Platz ' + pl.nr + ' löschen?',
            `<b>${escapeHtml(pl.name)}</b> — Reifegrad ${pl.level}, ${U.fmt(pl.lifetime)} Biomasse.
             Das lässt sich nicht rückgängig machen.`,
            () => { Save.loesche(pl.nr); zeichnePlaetze(); }, 'Löschen', true);
        };
      }
      box.appendChild(row);
    });
  }

  /** Neues Spiel - der Name wird vorher abgefragt, weil er in der
      Bestenliste steht und sich das Spiel automatisch dorthin einträgt. */
  function neuesMyzel(nr) {
    modal(`<h3>Wie soll dein Myzel heißen?</h3>
      <p>Unter diesem Namen erscheinst du in der weltweiten Bestenliste.
      Ändern kannst du ihn später jederzeit in den Optionen.</p>
      <input type="text" id="nm-name" maxlength="22" placeholder="z. B. Waldgeflecht" autocomplete="off">
      <div class="nm-hint" id="nm-hint"></div>
      <div class="mrow"><button class="btn ghost" id="nm-no">Abbrechen</button>
      <button class="btn btn-primary" id="nm-ok">Wachsen lassen</button></div>`, m => {
      const inp = U.$('#nm-name', m), hint = U.$('#nm-hint', m);
      setTimeout(() => inp.focus(), 60);
      const start = () => {
        const n = inp.value.trim();
        if (n.length < 2) { hint.textContent = 'Bitte mindestens zwei Zeichen.'; inp.focus(); return; }
        close();
        Save.newGame(n, nr);
        enter(true);
      };
      U.$('#nm-no', m).onclick = close;
      U.$('#nm-ok', m).onclick = start;
      inp.onkeydown = e => { if (e.key === 'Enter') start(); };
      inp.oninput = () => { hint.textContent = ''; };
    });
  }

  function showAbout() {
    modal(`<h3>Worum geht es?</h3>
      <p>Du bist ein <b>Myzel</b> — das Pilzgeflecht unter dem Waldboden. Du zersetzt, wächst und
      verbindest dich mit allem, was im Boden liegt.</p>
      <p><b>So spielt es sich:</b></p>
      <p>1. <b>Nähren</b> und Strukturen kaufen. Strukturen erzeugen Biomasse von allein.<br>
      2. Genug Biomasse bringt <b>Reifegrad</b>. Jeder Reifegrad gibt <b>Wachstumspunkte</b>.<br>
      3. Punkte steckst du in den <b>Skillbaum</b>. Der bleibt für immer — auch nach jedem Reset.<br>
      4. Später löst du dich beim <b>Sporenflug</b> auf und wächst mit dauerhaftem Bonus neu.<br>
      5. Noch später gehst du eine <b>Symbiose</b> mit ganzen Biomen ein.</p>
      <p>Das Spiel läuft auch weiter, wenn du es schließt. Es ist zum nebenbei Spielen gedacht:
      Es gibt keinen Verlust, keine Zeitfenster, keinen Druck.</p>
      <p style="font-size:12.5px;opacity:.7">Gespeichert wird automatisch im Browser dieses Geräts.</p>
      <div class="mrow"><button class="btn btn-primary" id="ab-ok">Verstanden</button></div>`,
      m => U.$('#ab-ok', m).onclick = close);
  }

  /* ================= Eintritt ins Spiel ================= */
  function enter(isNew) {
    const ss = U.$('#start-screen');
    ss.classList.add('leaving');
    setTimeout(() => ss.classList.add('hidden'), 560);
    U.$('#game').classList.remove('hidden');
    document.body.classList.add('in-game');
    afterLoad(isNew);
    Music.start();
    if (isNew) setTimeout(showAbout, 900);
  }

  /** Nach jedem Laden/Import: alles neu aufbauen. */
  function afterLoad(isNew) {
    E.recalc();
    UI.initTabs();
    UI.show('netz');
    UI.refreshAll();
    FX.seed();
    if (!isNew) checkOffline();
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  }

  function checkOffline() {
    if (!S.opt.offline) return;
    const dt = (Date.now() - (S.lastSave || Date.now())) / 1000;
    if (dt < 60) return;
    const res = E.offlineGain(dt);
    if (res.gain <= 0) {
      FX.toast('Willkommen zurück', `Du warst ${U.fmtTimeShort(dt)} weg.`, '');
      return;
    }
    E.applyOffline(res);
    modal(`<h3>🌙 Es ist weitergewachsen</h3>
      <p>Du warst <b>${U.fmtTime(res.raw)}</b> weg.
      ${res.capped ? `Angerechnet wurden <b>${U.fmtTime(res.seconds)}</b> (deine Offline-Kappe).` : 'Die volle Zeit wurde angerechnet.'}</p>
      <div class="offline-gain">+ ${U.fmt(res.gain)}</div>
      <p style="text-align:center;font-size:12.5px">bei ${U.fmt(res.rate)} /s und ${(E.m.offlineEff * 100).toFixed(0)} % Offline-Effizienz.<br>
      Beides lässt sich im Ast <b>Zersetzung</b> deutlich steigern.</p>
      <div class="mrow"><button class="btn btn-primary" id="of-ok">Weitermachen</button></div>`,
      m => U.$('#of-ok', m).onclick = close);
  }

  /* ================= Aktionen ================= */
  function prestige() {
    const g = E.sporeGain();
    if (g < 1) return;
    const go = () => {
      const got = E.doPrestige();
      FX.flash(); FX.sfx.prestige(); FX.resetNet();
      for (let i = 0; i < 60; i++) setTimeout(() => FX.burst(FX.W / 2, FX.H / 2, '#f7c948', 6, 9), i * 12);
      FX.toast('Sporenflug', `+${U.fmtInt(got)} Sporen. Das Netz beginnt von vorn.`, 'gold', 6000);
      UI.show('netz'); UI.refreshAll(); Save.write();
    };
    if (S.opt.confirmPrestige) {
      confirmBox('Sporenflug?', `Du erhältst <b>${U.fmtInt(g)} Sporen</b>. Biomasse und Strukturen gehen verloren,
        Skillbaum, Reifegrad, Erfolge und Mutationen bleiben.`, go, 'Auflösen');
    } else go();
  }

  function symbiose() {
    const g = E.spGain();
    if (g < 1) return;
    const go = () => {
      const got = E.doSym();
      FX.flash(true); FX.sfx.prestige(); FX.resetNet();
      for (let i = 0; i < 70; i++) setTimeout(() => FX.burst(FX.W / 2, FX.H / 2, '#b98bf0', 7, 10), i * 12);
      FX.toast('Symbiose', `+${U.fmtInt(got)} Symbiose-Punkte.`, 'violet', 6000);
      UI.show('symbiose'); UI.refreshAll(); Save.write();
    };
    if (S.opt.confirmPrestige) {
      confirmBox('Symbiose eingehen?', `Du erhältst <b>${U.fmtInt(g)} Symbiose-Punkte</b>.
        <b>Sporen und Mutationen gehen dabei verloren.</b> Skillbaum, Reifegrad, Erfolge und Biome bleiben.`, go, 'Verbinden');
    } else go();
  }

  function enterChall(id) {
    const ch = D.CHAL_BY_ID[id];
    confirmBox(`${ch.ic} ${ch.name} antreten?`,
      `Dein aktueller Durchlauf wird zurückgesetzt (ohne Sporen-Gewinn).<br><br>
       <b>Handicap:</b> ${ch.rule}<br><b>Ziel:</b> ${U.fmt(E.challGoal(id))} Biomasse im Durchlauf.<br>
       Du kannst jederzeit abbrechen.`,
      () => { E.enterChall(id); FX.sfx.unlock(); UI.show('netz'); UI.refreshAll(); }, 'Antreten');
  }

  /** Sicherung einspielen - als Datei oder als Text. */
  function ladeSicherung() {
    modal(`<h3>Sicherung laden</h3>
      <p>Wähle eine gespeicherte Datei oder füge den Text ein. Dein aktueller
      Fortschritt wird dabei <b>ersetzt</b>.</p>
      <input type="file" id="ld-file" accept=".txt,text/plain" style="margin-bottom:12px">
      <textarea class="save-area" id="ld-text" style="max-width:none" placeholder="… oder Spielstand hier einfügen"></textarea>
      <div class="mrow"><button class="btn ghost" id="ld-no">Abbrechen</button>
      <button class="btn btn-primary" id="ld-ok">Laden</button></div>`, m => {
      const uebernehmen = txt => {
        if (!txt || !txt.trim()) return FX.toast('Nichts zu laden', 'Wähle eine Datei oder füge den Text ein.', '');
        if (Save.importStr(txt.trim())) { close(); FX.toast('Geladen', 'Willkommen zurück.', 'lime'); afterLoad(); }
        else FX.toast('Fehlerhafte Sicherung', 'Der Inhalt konnte nicht gelesen werden.', '');
      };
      U.$('#ld-file', m).onchange = e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => U.$('#ld-text', m).value = String(r.result);
        r.readAsText(f);
      };
      U.$('#ld-no', m).onclick = close;
      U.$('#ld-ok', m).onclick = () => uebernehmen(U.$('#ld-text', m).value);
    });
  }

  /* ================= Bestenliste ================= */
  async function showLeaderboard(fromStart) {
    modal(`<h3>Bestenliste</h3><p>Wird geladen …</p>`);
    const { list, online } = await LB.fetchList();
    const mineId = (S && S.pid) || '';

    const zeile = (e, i) => `
      <div class="lb-row ${i === 0 ? 'top1' : ''} ${e.id && e.id === mineId ? 'me' : ''}" data-i="${i}">
        <span class="r">${i + 1}</span>
        <span class="n">${escapeHtml(e.name)}</span>
        <span class="lbv">Reifegrad <b>${e.level}</b></span>
        <span class="lbv">${U.fmt(e.bio)}</span>
        <span class="lbv dim">${e.pres} Flüge</span>
        <span class="lbv dim">${e.biomes}/8 Biome</span>
        <span class="lb-more">▾</span>
      </div>
      <div class="lb-detail" data-d="${i}"></div>`;

    modal(`<h3>Bestenliste</h3>
      <p>${online
        ? 'Sortiert nach Reifegrad, bei Gleichstand nach der gesamten Biomasse. Zeile antippen für Einzelheiten.'
        : 'Die Rangliste ist gerade nicht erreichbar — hier steht der zuletzt geladene Stand.'}</p>
      <div class="lb-head"><span class="r">#</span><span class="n">Myzel</span>
        <span class="lbv">Stand</span><span class="lbv">Biomasse</span>
        <span class="lbv dim">Flüge</span><span class="lbv dim">Biome</span><span class="lb-more"></span></div>
      <div class="lb-list">${list.slice(0, 30).map(zeile).join('') || '<p style="opacity:.6">Noch keine Einträge. Sei der erste.</p>'}</div>
      <div class="mrow"><button class="btn ghost" id="lb-close">Schließen</button></div>`, m => {
      U.$('#lb-close', m).onclick = close;
      U.$$('.lb-row', m).forEach(row => {
        row.onclick = () => {
          const i = +row.dataset.i, e = list[i];
          const d = U.$(`.lb-detail[data-d="${i}"]`, m);
          const offen = d.classList.toggle('on');
          row.classList.toggle('open', offen);
          if (offen && !d.innerHTML) {
            const zeit = e.date ? U.fmtTimeShort((Date.now() - e.date) / 1000) + ' her' : 'unbekannt';
            d.innerHTML = `<div class="lb-grid">
              ${detail('Reifegrad', e.level)}
              ${detail('Biomasse gesamt', U.fmt(e.bio))}
              ${detail('Beste Produktion', U.fmt(e.rate) + ' /s')}
              ${detail('Sporenflüge', U.fmtInt(e.pres))}
              ${detail('Symbiose-Punkte', U.fmtInt(e.sp))}
              ${detail('Biome', e.biomes + ' / 8')}
              ${detail('Skill-Stufen', U.fmtInt(e.nodes))}
              ${detail('Erfolge', e.ach + ' / 59')}
              ${detail('Prüfungsstufen', e.chall + ' / 12')}
              ${detail('Goldene Sporen', U.fmtInt(e.golds))}
              ${detail('Spielzeit', U.fmtTimeShort(e.playTime))}
              ${detail('Zuletzt aktiv', zeit)}
            </div>`;
          }
        };
      });
    });
  }
  const detail = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* ================= Ereignisse aus der Engine ================= */
  function drainEvents() {
    while (E.events.length) {
      const ev = E.events.shift();
      if (ev.t === 'level') {
        FX.sfx.unlock();
        FX.toast('Reifegrad ' + ev.v, `+${ev.wp} Wachstumspunkt${ev.wp === 1 ? '' : 'e'} für den Skillbaum.`, 'lime');
        UI.pulse('.level-res'); UI.pulse('.res-wp');
        FX.burst(FX.W * 0.22, 60, '#a6e85c', 18, 4);
      } else if (ev.t === 'ach') {
        FX.sfx.ach();
        FX.toast('✦ ' + ev.a.name, ev.a.d, '');
      } else if (ev.t === 'struct') {
        FX.sfx.unlock();
        FX.toast('Neue Struktur', `${D.STRUCTS[ev.i].ic} ${D.STRUCTS[ev.i].name} — ${D.STRUCTS[ev.i].desc}`, 'lime', 6000);
      } else if (ev.t === 'chall') {
        FX.sfx.ach(); FX.flash();
        FX.toast('Prüfung bestanden', `${ev.ch.name} Stufe ${ev.tier}: ${ev.ch.rewardText[ev.tier - 1]}`, 'gold', 7000);
      } else if (ev.t === 'autopres') {
        FX.resetNet();
        FX.toast('Sporenflug (automatisch)', `+${U.fmtInt(ev.v)} Sporen`, 'gold');
      } else if (ev.t === 'gold') {
        FX.spawnGold((x, y) => {
          const r = E.catchGold();
          FX.sfx.gold();
          FX.toast('✨ ' + r.def.name, r.instant !== undefined
            ? `+${U.fmt(r.instant)} Biomasse sofort`
            : r.def.d(r.mult), 'gold', 5200);
          FX.pop(x, y - 30, r.def.name, '#f7c948');
          UI.refreshTab();
        });
      }
    }
  }

  /* ================= Hauptschleife ================= */
  function loop(t) {
    const dt = Math.min(0.25, (t - last) / 1000);
    last = t;
    E.tick(dt);
    drainEvents();

    // Netz-Wachstum an die Produktion koppeln
    FX.setGrowSpeed(0.25 + Math.min(3.2, Math.log10(Math.max(1, E.total)) * 0.42));

    uiAcc += dt;
    if (uiAcc >= 0.1) {
      uiAcc = 0;
      UI.refreshTop();
      UI.refreshTab();
      UI.refreshTabs();
    }
    saveAcc += dt;
    if (saveAcc >= 12) { saveAcc = 0; Save.write(); LB.autoSubmit(); }
    requestAnimationFrame(loop);
  }

  /* ================= Tasten ================= */
  function initKeys() {
    window.addEventListener('keydown', ev => {
      if (!S || U.$('#game').classList.contains('hidden')) return;
      const tag = (ev.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const k = ev.key.toLowerCase();
      if (k >= '1' && k <= '8') { const i = +k - 1; if (E.buy(i) > 0) { FX.sfx.buy(); UI.refreshTab(); } }
      else if (k === 'm') { let any = 0; for (let i = 7; i >= 0; i--) any += E.buy(i); if (any) { FX.sfx.buy(); UI.refreshTab(); } }
      else if (k === ' ') { ev.preventDefault(); const g = E.doClick(true); FX.pop(FX.W / 2, FX.H / 2, '+' + U.fmt(g)); FX.sfx.click(); }
      else if (k === 'p') prestige();
      else if (k === 's') symbiose();   // gespeichert wird automatisch, die Taste ist frei
      else if (k === 'escape') close();
    });
  }

  /* ================= Start ================= */
  function boot() {
    FX.init();
    initStart();
    initKeys();
    U.$('#btn-sound').onclick = () => { S.opt.sound = !S.opt.sound; UI.refreshTop(); if (S.opt.sound) FX.sfx.click(); };
    U.$('#btn-music').onclick = () => { Music.umschalten(); UI.refreshTop(); };
    U.$('#btn-menu').onclick = () => UI.show('optionen');
    window.addEventListener('beforeunload', () => { if (S) Save.write(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && S) Save.write(); });
  }

  return { boot, enter, afterLoad, prestige, symbiose, enterChall, showLeaderboard, ladeSicherung, confirm: confirmBox, modal, close };
})();

window.addEventListener('DOMContentLoaded', Game.boot);
