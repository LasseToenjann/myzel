/* ============================================================
   MYZEL - main.js
   Startbildschirm, Spielschleife, Modale, Tasten
   ============================================================ */
const Game = (() => {

  let last = 0, uiAcc = 0, saveAcc = 0, running = false;
  let wanduhr = Date.now();      // echte Uhrzeit des letzten Bildes

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
          <button class="slot-ren" title="Umbenennen">✎</button>
          <button class="slot-del" title="Diesen Platz löschen">×</button>
          <div class="slot-go">▸</div>`;
        row.onclick = ev => {
          if (ev.target.closest('.slot-del') || ev.target.closest('.slot-ren')) return;
          if (Save.load(pl.nr)) enter(false);
        };
        row.querySelector('.slot-ren').onclick = ev => { ev.stopPropagation(); umbenennen(pl); };
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

  /** Umbenennen. Zieht den Namen auch in der Bestenliste nach, sonst stünde
      der Spielstand dort weiter unter dem alten. */
  function umbenennen(pl) {
    modal(`<h3>Myzel umbenennen</h3>
      <p>Der neue Name gilt auch in der weltweiten Bestenliste.</p>
      <input type="text" id="rn-name" maxlength="22" value="${escapeHtml(pl.name)}" autocomplete="off">
      <div class="nm-hint" id="rn-hint"></div>
      <div class="mrow"><button class="btn ghost" id="rn-no">Abbrechen</button>
      <button class="btn btn-primary" id="rn-ok">Umbenennen</button></div>`, m => {
      const inp = U.$('#rn-name', m), hint = U.$('#rn-hint', m), knopf = U.$('#rn-ok', m);
      setTimeout(() => { inp.focus(); inp.select(); }, 60);
      const los = async () => {
        const n = inp.value.trim();
        if (n.length < 2) { hint.textContent = 'Bitte mindestens zwei Zeichen.'; return; }
        const daten = Save.peek(pl.nr);
        if (!daten) return close();
        daten.name = n.slice(0, 22);
        Save.schreibePlatz(pl.nr, daten);
        if (S && Save.aktiv === pl.nr) S.name = daten.name;
        knopf.disabled = true; knopf.textContent = 'Moment …';
        await LB.umbenennen(daten.pid, daten.name);
        LB.resetAuto();
        close();
        zeichnePlaetze();
        FX.toast('Umbenannt', 'Der Spielstand heißt jetzt „' + daten.name + '".', 'lime');
      };
      U.$('#rn-no', m).onclick = close;
      knopf.onclick = los;
      inp.onkeydown = e => { if (e.key === 'Enter') los(); };
      inp.oninput = () => { hint.textContent = ''; };
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

  /* ================= Eintritt ins Spiel ================= */
  function enter(isNew) {
    const ss = U.$('#start-screen');
    ss.classList.add('leaving');
    setTimeout(() => ss.classList.add('hidden'), 560);
    U.$('#game').classList.remove('hidden');
    document.body.classList.add('in-game');
    afterLoad(isNew);
    Music.start();
  }

  /** Zurueck ins Startmenue, um den Spielstand zu wechseln.
      Vorher wird gespeichert, damit nichts verloren geht. */
  function zumMenue() {
    Save.write();
    Music.stop();
    document.body.classList.remove('in-game');
    U.$('#game').classList.add('hidden');
    const ss = U.$('#start-screen');
    ss.classList.remove('leaving', 'hidden');
    zeichnePlaetze();
  }

  /** Nach jedem Laden/Import: alles neu aufbauen. */
  function afterLoad(isNew) {
    E.recalc();
    UI.initTabs();
    UI.show('netz');
    UI.refreshAll();
    FX.seed();
    if (!isNew) checkOffline();
    if (!running) { running = true; last = performance.now(); wanduhr = Date.now(); requestAnimationFrame(loop); }
  }

  /* ================= Rueckkehr =================
     Eine Stelle fuer beide Faelle: Seite neu geladen (lastSeen aus dem
     Spielstand) und Seite war nur schlafen (Luecke in der Wanduhr). */

  const PAUSE_GRENZE = 30;        // bis hierhin gilt es als kurze Unterbrechung

  function schnappschuss() {
    return {
      bio: S.biomass, level: S.level, ach: S.ach.length, sporen: E.sporeGain(),
      strukturen: S.structs.map((_, i) => E.isUnlocked(i))
    };
  }

  /** Rechnet eine Abwesenheit an. Gibt zurueck, ob es etwas zu zeigen gab. */
  function rueckkehr(sekunden) {
    if (!S || !isFinite(sekunden) || sekunden <= 0) return false;
    if (!S.opt.offline) return false;

    const vorher = schnappschuss();
    const res = E.offlineGain(sekunden);
    if (res.gain <= 0) {
      if (sekunden > 120) FX.toast('Willkommen zurück', 'Du warst ' + U.fmtTimeShort(sekunden) + ' weg.', '');
      return false;
    }
    E.applyOffline(res);
    E.tick(0);                       // Reifegrad, Erfolge und Strukturen nachziehen

    // Diese Meldungen stehen gleich in der Uebersicht - nicht auch noch als Toast.
    for (let i = E.events.length - 1; i >= 0; i--) {
      if (E.events[i].t === 'level' || E.events[i].t === 'ach') E.events.splice(i, 1);
    }

    const nachher = schnappschuss();
    UI.refreshAll();
    Save.write();
    // Im Startmenue waere die Uebersicht fehl am Platz - dort wird nur gutgeschrieben.
    const imSpiel = !U.$('#game').classList.contains('hidden');
    if (sekunden >= 60 && imSpiel) zeigeRueckkehr(res, vorher, nachher);
    return true;
  }

  /** Uebersicht mit hochzaehlender Zahl und dem, was dazugekommen ist. */
  function zeigeRueckkehr(res, vorher, nachher) {
    const stufen = nachher.level - vorher.level;
    const erfolge = nachher.ach - vorher.ach;
    const neueStrukturen = nachher.strukturen
      .map((u, i) => (u && !vorher.strukturen[i]) ? D.STRUCTS[i] : null).filter(Boolean);
    const sporenJetzt = Math.floor(nachher.sporen - vorher.sporen);

    const karten = [];
    if (stufen > 0) karten.push(['\u2737', stufen, stufen === 1 ? 'Reifegrad' : 'Reifegrade', 'lime']);
    neueStrukturen.forEach(st => karten.push([st.ic, '', st.name + ' frei', 'lime']));
    if (erfolge > 0) karten.push(['\u2726', erfolge, erfolge === 1 ? 'Erfolg' : 'Erfolge', 'gold']);
    if (sporenJetzt > 0) karten.push(['\u2732', U.fmtInt(sporenJetzt), 'Sporen bereit', 'gold']);

    const zeitText = res.capped
      ? ' \u2014 angerechnet wurden <b>' + U.fmtTime(res.seconds) + '</b>, mehr fasst deine Offline-Kappe nicht.'
      : ' \u2014 die volle Zeit wurde angerechnet.';
    const fussText = res.capped
      ? 'Kappe und Ausbeute steigen im Ast <b>Zersetzung</b>.'
      : 'bei ' + U.fmt(res.rate) + ' /s und ' + (E.m.offlineEff * 100).toFixed(0) + ' % Offline-Ausbeute';

    const kartenHtml = karten.length ? '<div class="rk-karten">' + karten.map(function (k, i) {
      return '<div class="rk-karte ' + k[3] + '" style="animation-delay:' + (0.5 + i * 0.1).toFixed(2) + 's">' +
        '<span class="rk-ic">' + k[0] + '</span>' +
        '<span class="rk-v">' + (k[1] === '' ? '' : '+' + k[1]) + '</span>' +
        '<span class="rk-t">' + k[2] + '</span></div>';
    }).join('') + '</div>' : '';

    modal('<div class="rueck">' +
      '<div class="rk-mond">\ud83c\udf19</div>' +
      '<h3>Es ist weitergewachsen</h3>' +
      '<div class="rk-zahl"><span id="rk-count">0</span><span class="rk-einheit">Biomasse</span></div>' +
      '<p class="rk-zeit">Du warst <b>' + U.fmtTime(res.raw) + '</b> weg' + zeitText + '</p>' +
      kartenHtml +
      '<p class="rk-fuss">' + fussText + '</p>' +
      '<div class="mrow"><button class="btn btn-primary" id="rk-ok">Weitermachen</button></div>' +
      '</div>', m => {
        U.$('#rk-ok', m).onclick = close;
        zaehleHoch(U.$('#rk-count', m), res.gain, 1200);
        FX.burst(FX.W / 2, FX.H * 0.42, '#a6e85c', 26, 5);
      });
    FX.sfx.unlock();
  }

  /** Laesst eine Zahl weich hochlaufen - erst schnell, dann ausklingend. */
  function zaehleHoch(el, ziel, dauer) {
    if (!el) return;
    const start = performance.now();
    const schritt = jetzt => {
      const t = Math.min(1, (jetzt - start) / dauer);
      const weich = 1 - Math.pow(1 - t, 3);
      el.textContent = U.fmt(ziel * weich);
      if (t < 1) requestAnimationFrame(schritt);
      else el.textContent = U.fmt(ziel);
    };
    requestAnimationFrame(schritt);
  }

  /** Beim Betreten: Zeit seit dem letzten Lebenszeichen des Spielstands. */
  function checkOffline() {
    const dt = (Date.now() - (S.lastSeen || S.lastSave || Date.now())) / 1000;
    if (dt < 60) return;
    rueckkehr(dt);
  }

  /** Nach dem Aufwachen: Wie lange stand die Schleife still?
      Kurze Unterbrechungen werden als echte Zeit nachgerechnet, damit
      nichts verloren geht; lange gelten als Offline-Zeit. */
  function pruefePause() {
    if (!S || !running) return;
    const jetzt = Date.now();
    const luecke = (jetzt - wanduhr) / 1000;
    wanduhr = jetzt;
    if (luecke <= 1.5) return;
    if (luecke <= PAUSE_GRENZE) {
      let rest = luecke;
      while (rest > 0.001) { const d = Math.min(0.25, rest); E.tick(d); rest -= d; }
      drainEvents();
      return;
    }
    rueckkehr(luecke);
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

    /* Die Zeile zeigt nur, was zaehlt: Rang, Name, Reifegrad. Der Name bekommt
       den ganzen uebrigen Platz - vorher wurde er nach vier Zeichen
       abgeschnitten, obwohl er das Wichtigste ist. Alles andere erscheint
       beim Aufklappen. */
    const zeile = (e, i) => `
      <div class="lb-row ${i === 0 ? 'top1' : ''} ${e.id && e.id === mineId ? 'me' : ''}" data-i="${i}">
        <span class="r">${i + 1}</span>
        <span class="n">${escapeHtml(e.name)}</span>
        <span class="lbv">Reifegrad <b>${e.level}</b></span>
        <span class="lb-more">▾</span>
      </div>
      <div class="lb-detail" data-d="${i}"></div>`;

    modal(`<h3>Bestenliste</h3>
      <p>${online
        ? 'Sortiert nach Reifegrad, bei Gleichstand nach der gesamten Biomasse. Zeile antippen für Einzelheiten.'
        : 'Die Rangliste ist gerade nicht erreichbar — hier steht der zuletzt geladene Stand.'}</p>
      <div class="lb-head"><span class="r">#</span><span class="n">Myzel</span>
        <span class="lbv">Stand</span><span class="lb-more"></span></div>
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

  /** Einzelheiten eines Ranglisten-Eintrags - auch von der Statistik genutzt. */
  function lbDetail(e) {
    const zeit = e.date ? U.fmtTimeShort((Date.now() - e.date) / 1000) + ' her' : 'unbekannt';
    return `<div class="lb-grid">
      ${detail('Biomasse gesamt', U.fmt(e.bio))}
      ${detail('Beste Produktion', U.fmt(e.rate) + ' /s')}
      ${detail('Sporenflüge', U.fmtInt(e.pres))}
      ${detail('Symbiose-Punkte', U.fmtInt(e.sp))}
      ${detail('Biome', e.biomes + ' / 8')}
      ${detail('Skill-Stufen', U.fmtInt(e.nodes))}
      ${detail('Erfolge', e.ach + ' / 59')}
      ${detail('Goldene Sporen', U.fmtInt(e.golds))}
      ${detail('Spielzeit', U.fmtTimeShort(e.playTime))}
      ${detail('Zuletzt aktiv', zeit)}
    </div>`;
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* ================= Erklärungen genau dann, wenn sie gebraucht werden ====
     Jede Erklärung erscheint genau einmal - beim ersten Auftauchen der
     Sache. Ein Tutorial vorweg liest niemand, und danach ist es weg. */
  const TIPPS = [
    ['klick', () => true,
      'Antippen gibt Biomasse', 'Davon kaufst du Strukturen — die arbeiten dann von allein weiter.'],
    ['struktur', () => S.structs.some(v => v > 0),
      'Deine erste Struktur', 'Sie erzeugt Biomasse, ohne dass du etwas tust. Je 25 Stück verdoppelt sich ihre Ausbeute.'],
    ['punkt', () => E.wpAvail() > 0,
      'Ein Wachstumspunkt', 'Reifegrad bringt Punkte für den Skillbaum. Der bleibt für immer — auch nach jedem Neuanfang.'],
    ['baum', () => E.nodeLevelSum() > 0,
      'Der Baum wächst', 'Sichtbar ist immer nur, was als Nächstes erreichbar ist. Jeder Ast steht für etwas anderes.'],
    ['gold', () => S.stats.golds > 0,
      'Goldene Sporen', 'Sie treiben ab und zu über den Bildschirm. Anklicken gibt einen zeitlich begrenzten Schub.'],
    ['auto', () => E.m.auto.some(Boolean),
      'Autokäufer', 'Kauft ab jetzt von selbst. Abschalten kannst du ihn je Struktur mit dem kleinen AUTO-Knopf.'],
    ['sporen', () => E.sporeGain() >= 1,
      'Sporenflug möglich', 'Du löst dich auf und beginnst neu — Biomasse und Strukturen gehen, alles andere bleibt. Die Sporen erhöhen dauerhaft deine Produktion.'],
    ['mutation', () => S.sporen > 0,
      'Mutationen', 'Von Sporen gekauft und für immer behalten. Der Bonus aus allen je gesammelten Sporen bleibt dabei unberührt.'],
    ['symbiose', () => E.symUnlocked(),
      'Die Symbiose ist offen', 'Die letzte Schicht: Sporen und Mutationen gehen, dafür erschließt du Biome — und die öffnen die äußeren Ringe im Skillbaum.'],
    ['offline', () => S.stats.offlineRuns > 0,
      'Es wächst auch ohne dich', 'Wie lange und wie ergiebig, bestimmst du im Ast Zersetzung.']
  ];

  let letzterTipp = 0;

  function tippsPruefen() {
    if (!S.seenTips) S.seenTips = [];
    // Abstand halten, sonst stapeln sich beim Start mehrere Meldungen
    if (Date.now() - letzterTipp < 7000) return;
    for (const [id, wenn, titel, text] of TIPPS) {
      if (S.seenTips.includes(id)) continue;
      let treffer = false;
      try { treffer = wenn(); } catch (e) { treffer = false; }
      if (!treffer) continue;
      S.seenTips.push(id);
      letzterTipp = Date.now();
      FX.toast(titel, text, 'lime', 8000);
      FX.sfx.unlock();
      return;                       // höchstens eine Erklärung auf einmal
    }
  }

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
    pruefePause();               // stand die Schleife still? Zeit nachtragen
    E.tick(dt);
    S.lastSeen = Date.now();
    drainEvents();
    tippsPruefen();

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
    /* Safari auf dem iPad entlaedt die Seite nicht, es legt sie schlafen -
       beforeunload kommt dort oft gar nicht an. pagehide kommt immer. */
    window.addEventListener('beforeunload', () => { if (S) Save.write(); });
    window.addEventListener('pagehide', () => { if (S) { Save.write(); LB.autoSubmit(true); } });
    document.addEventListener('visibilitychange', () => {
      if (!S) return;
      if (document.hidden) { Save.write(); return; }
      pruefePause();
    });
    window.addEventListener('focus', () => { if (S) pruefePause(); });
  }

  return { boot, enter, afterLoad, zumMenue, prestige, symbiose, showLeaderboard, ladeSicherung,
    lbDetail, escape: escapeHtml, confirm: confirmBox, modal, close };
})();

window.addEventListener('DOMContentLoaded', Game.boot);
