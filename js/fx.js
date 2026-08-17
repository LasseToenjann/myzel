/* ============================================================
   MYZEL - fx.js
   Hintergrund-Myzel, Partikel, goldene Sporen, Toasts, Ton
   ============================================================ */
const FX = (() => {

  let netC, netX, parC, parX, W = 0, H = 0, dpr = 1;
  let tips = [], segs = 0, growAcc = 0, growSpeed = 1;
  let particles = [];
  let running = false;
  let fadeAlpha = 0;

  /* ---------------- Setup ---------------- */
  function init() {
    netC = U.$('#fx-net'); netX = netC.getContext('2d');
    parC = U.$('#fx-particles'); parX = parC.getContext('2d');
    resize();
    window.addEventListener('resize', () => { resize(); seed(); });
    seed();
    grow(180);          // damit der Startbildschirm sofort bewachsen aussieht
    running = true;
    requestAnimationFrame(loop);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    [netC, parC].forEach(c => {
      c.width = W * dpr; c.height = H * dpr;
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    netX.clearRect(0, 0, W, H);
  }

  /* ---------------- Myzel-Netz ---------------- */
  function seed() {
    tips = []; segs = 0;
    netX.clearRect(0, 0, W, H);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + U.rnd(-.3, .3);
      tips.push({ x: W / 2, y: H / 2, a, gen: 0, life: 0 });
    }
  }

  function grow(steps) {
    if (segs > 5200) return;
    for (let s = 0; s < steps; s++) {
      const next = [];
      for (const t of tips) {
        t.a += U.rnd(-0.34, 0.34);
        const len = U.rnd(5, 13);
        const nx = t.x + Math.cos(t.a) * len;
        const ny = t.y + Math.sin(t.a) * len;
        const alpha = U.clamp(0.30 - t.gen * 0.028, 0.05, 0.3);
        netX.strokeStyle = `rgba(${90 + t.gen * 12},${220 - t.gen * 6},${170 + t.gen * 4},${alpha})`;
        netX.lineWidth = Math.max(0.5, 2.1 - t.gen * 0.22);
        netX.beginPath();
        netX.moveTo(t.x, t.y);
        netX.lineTo(nx, ny);
        netX.stroke();
        segs++;
        t.x = nx; t.y = ny; t.life++;

        // Knötchen
        if (Math.random() < 0.035) {
          netX.fillStyle = `rgba(170,240,140,${alpha + 0.18})`;
          netX.beginPath(); netX.arc(nx, ny, U.rnd(1, 2.4), 0, 7); netX.fill();
        }
        // außerhalb -> neu setzen
        if (nx < -60 || nx > W + 60 || ny < -60 || ny > H + 60 || t.life > 190) continue;
        next.push(t);
        // verzweigen
        if (Math.random() < 0.055 && next.length < 90 && t.gen < 8) {
          next.push({ x: nx, y: ny, a: t.a + U.rnd(-1.1, 1.1), gen: t.gen + 1, life: 0 });
        }
      }
      tips = next;
      if (tips.length < 4 && segs < 5000) {
        const a = U.rnd(0, 7);
        tips.push({ x: W / 2 + Math.cos(a) * 40, y: H / 2 + Math.sin(a) * 40, a, gen: 0, life: 0 });
      }
    }
  }

  function setGrowSpeed(v) { growSpeed = U.clamp(v, 0.15, 6); }

  /** Netz auflösen und neu beginnen (Sporenflug) */
  function resetNet() { fadeAlpha = 1; }

  /* ---------------- Partikel ---------------- */
  function burst(x, y, color, count, spd) {
    if (S && S.opt && !S.opt.particles) return;
    count = count || 14;
    for (let i = 0; i < count; i++) {
      const a = U.rnd(0, Math.PI * 2), v = U.rnd(0.5, spd || 3.4);
      particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6,
        r: U.rnd(1.3, 3.6), life: 1, decay: U.rnd(0.008, 0.022), col: color || '#a6e85c', g: 0.028
      });
    }
  }

  function drift(count) {
    if (S && S.opt && !S.opt.particles) return;
    for (let i = 0; i < (count || 1); i++) {
      particles.push({
        x: U.rnd(0, W), y: H + 10, vx: U.rnd(-.25, .25), vy: U.rnd(-.35, -.9),
        r: U.rnd(1, 2.6), life: 1, decay: 0.0022, col: 'rgba(180,240,190,0.7)', g: -0.0006
      });
    }
  }

  function stepParticles() {
    parX.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life -= p.decay;
      if (p.life <= 0 || p.y > H + 30 || p.y < -30) { particles.splice(i, 1); continue; }
      parX.globalAlpha = U.clamp(p.life, 0, 1);
      parX.fillStyle = p.col;
      parX.beginPath(); parX.arc(p.x, p.y, p.r, 0, 7); parX.fill();
    }
    parX.globalAlpha = 1;
  }

  /* ---------------- Loop ---------------- */
  let driftAcc = 0;
  function loop() {
    if (!running) return;
    growAcc += growSpeed;
    while (growAcc >= 1) { grow(1); growAcc -= 1; }
    if (fadeAlpha > 0) {
      netX.globalCompositeOperation = 'destination-out';
      netX.fillStyle = 'rgba(0,0,0,0.06)';
      netX.fillRect(0, 0, W, H);
      netX.globalCompositeOperation = 'source-over';
      fadeAlpha -= 0.012;
      if (fadeAlpha <= 0) { fadeAlpha = 0; seed(); }
    }
    driftAcc += 1;
    if (driftAcc > 26) { driftAcc = 0; drift(1); }
    stepParticles();
    requestAnimationFrame(loop);
  }

  /* ---------------- Zahlen-Popups ---------------- */
  function pop(x, y, text, col) {
    const e = U.el('div', 'pop', text);
    e.style.left = x + 'px'; e.style.top = y + 'px';
    if (col) e.style.color = col;
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 1000);
  }

  /* ---------------- Toasts ---------------- */
  function toast(title, desc, cls, ms) {
    const box = U.$('#toasts');
    if (!box) return;
    const t = U.el('div', 'toast ' + (cls || ''));
    t.innerHTML = `<div class="tt">${title}</div>` + (desc ? `<div class="td">${desc}</div>` : '');
    box.appendChild(t);
    while (box.children.length > 5) box.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms || 4200);
  }

  /* ---------------- Blitz ---------------- */
  function flash(violet) {
    const f = U.$('#flash');
    f.classList.toggle('violet', !!violet);
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  /* ---------------- Goldene Spore ---------------- */
  let goldEl = null;
  function spawnGold(onCatch) {
    if (goldEl) return;
    const e = U.el('div', '', '✨');
    const startLeft = Math.random() < 0.5;
    let x = startLeft ? -50 : W + 50;
    let y = U.rnd(H * 0.2, H * 0.8);
    const vx = (startLeft ? 1 : -1) * U.rnd(0.55, 1.15);
    let vy = U.rnd(-0.35, 0.35);
    Object.assign(e.style, {
      position: 'fixed', zIndex: 65, fontSize: '40px', cursor: 'pointer', userSelect: 'none',
      filter: 'drop-shadow(0 0 18px #f7c948) drop-shadow(0 0 34px rgba(247,201,72,.6))',
      transition: 'transform .15s', left: '0px', top: '0px', willChange: 'transform'
    });
    e.title = 'Goldene Spore — anklicken!';
    document.body.appendChild(e);
    goldEl = e;
    let alive = true;
    const t0 = Date.now();
    e.addEventListener('mouseenter', () => e.style.transform += ' scale(1.25)');
    e.addEventListener('click', ev => {
      if (!alive) return;
      alive = false;
      burst(ev.clientX, ev.clientY, '#f7c948', 34, 5.5);
      e.remove(); goldEl = null;
      onCatch(ev.clientX, ev.clientY);
    });
    (function move() {
      if (!alive) return;
      x += vx * 1.5; y += vy + Math.sin((Date.now() - t0) / 620) * 0.55;
      e.style.transform = `translate(${x}px,${y}px) rotate(${Math.sin((Date.now() - t0) / 800) * 18}deg)`;
      const gone = (vx > 0 && x > W + 70) || (vx < 0 && x < -70) || Date.now() - t0 > 26000;
      if (gone) { alive = false; e.remove(); goldEl = null; return; }
      requestAnimationFrame(move);
    })();
  }

  /* ---------------- Ton ---------------- */
  let actx = null;
  function ac() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (!S || !S.opt.sound) return;
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
    g.gain.setValueAtTime(0, a.currentTime);
    const lauf = (S.opt.sfxVol === undefined ? 0.6 : S.opt.sfxVol);
    g.gain.linearRampToValueAtTime((vol || 0.06) * lauf * 1.6, a.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }
  const sfx = {
    click: () => tone(U.rnd(420, 520), 0.09, 'sine', 0.035),
    buy: () => { tone(330, 0.1, 'triangle', 0.05); setTimeout(() => tone(495, 0.13, 'triangle', 0.04), 55); },
    node: () => { tone(392, 0.12, 'sine', 0.06); setTimeout(() => tone(587, 0.16, 'sine', 0.05), 70); },
    ach: () => { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sine', 0.05), i * 90)); },
    gold: () => { [880, 1175, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.28, 'triangle', 0.05), i * 60)); },
    prestige: () => { tone(147, 1.6, 'sine', 0.09, 588); [262, 330, 392, 523].forEach((f, i) => setTimeout(() => tone(f, 0.9, 'sine', 0.05), 260 + i * 150)); },
    unlock: () => { tone(294, 0.14, 'triangle', 0.05); setTimeout(() => tone(440, 0.2, 'triangle', 0.045), 90); },
    err: () => tone(150, 0.12, 'square', 0.025)
  };

  return { init, grow, seed, setGrowSpeed, resetNet, burst, drift, pop, toast, flash, spawnGold, sfx, get W() { return W; }, get H() { return H; } };
})();
