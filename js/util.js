/* ============================================================
   MYZEL - util.js
   Zahlformatierung, DOM-Helfer, Kleinkram
   ============================================================ */
const U = (() => {

  // Deutsche lange Leiter: Tausend, Million, Milliarde, Billion, Billiarde, ...
  const SUF = ['', 'K', 'Mio', 'Mrd', 'Bio', 'Brd', 'Tri', 'Trd', 'Qua', 'Qrd', 'Qui',
    'Qid', 'Sex', 'Sxd', 'Sep', 'Spd', 'Okt', 'Okd', 'Non', 'Nod', 'Dez'];

  /** Formatiert eine Zahl je nach Notationseinstellung. */
  function fmt(n, dec) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + fmt(-n, dec);
    if (n < 1) return n === 0 ? '0' : n.toFixed(dec === undefined ? 2 : dec);
    if (n < 1000) {
      if (n < 10) return trim(n.toFixed(2));
      if (n < 100) return trim(n.toFixed(1));
      return Math.floor(n).toString();
    }
    const notation = (typeof S !== 'undefined' && S && S.opt) ? S.opt.notation : 'kurz';
    const e = Math.floor(Math.log10(n));
    if (notation === 'wiss' || e >= SUF.length * 3) {
      return (n / Math.pow(10, e)).toFixed(2) + 'e' + e;
    }
    const t = Math.floor(e / 3);
    const m = n / Math.pow(1000, t);
    return (m < 10 ? m.toFixed(2) : m < 100 ? m.toFixed(1) : Math.floor(m).toString()) + ' ' + SUF[t];
  }

  function trim(s) { return s.replace(/\.?0+$/, ''); }

  /** Ganzzahl mit Tausenderpunkten. */
  function fmtInt(n) {
    if (n < 1e6) return Math.floor(n).toLocaleString('de-DE');
    return fmt(n);
  }

  /** Multiplikator, z.B. "x1,25" */
  function fmtMul(n) {
    if (n >= 1000) return '×' + fmt(n);
    if (n >= 100) return '×' + n.toFixed(0);
    if (n >= 10) return '×' + n.toFixed(1);
    return '×' + n.toFixed(2);
  }

  function fmtPct(n) { return (n >= 0 ? '+' : '') + (n * 100).toFixed(n * 100 % 1 === 0 ? 0 : 1) + '%'; }

  /** Sekunden -> "2 h 14 min" */
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s));
    if (s < 60) return s + ' s';
    if (s < 3600) return Math.floor(s / 60) + ' min ' + (s % 60) + ' s';
    if (s < 86400) return Math.floor(s / 3600) + ' h ' + Math.floor((s % 3600) / 60) + ' min';
    return Math.floor(s / 86400) + ' d ' + Math.floor((s % 86400) / 3600) + ' h';
  }

  function fmtTimeShort(s) {
    if (!isFinite(s) || s > 3.15e9) return 'nie';
    s = Math.max(0, Math.floor(s));
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
    if (s < 86400) return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
    return Math.floor(s / 86400) + 'd ' + Math.floor((s % 86400) / 3600) + 'h';
  }

  /* ---------- DOM ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function svgEl(tag, attrs) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /** Klemmt v in [a,b]. */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /** Summe einer geometrischen Reihe: base*(g^0 + ... + g^(n-1)) */
  function geoSum(base, g, n) {
    if (n <= 0) return 0;
    if (Math.abs(g - 1) < 1e-9) return base * n;
    return base * (Math.pow(g, n) - 1) / (g - 1);
  }

  /** Größtes n mit geoSum(base,g,n) <= budget */
  function geoMax(base, g, budget) {
    if (budget < base) return 0;
    if (Math.abs(g - 1) < 1e-9) return Math.floor(budget / base);
    const v = budget * (g - 1) / base + 1;
    if (v <= 0) return 0;
    return Math.max(0, Math.floor(Math.log(v) / Math.log(g)));
  }

  /* ---------- Speicher-Kodierung ---------- */
  function encode(obj) {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)));
  }
  function decode(str) {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    } catch (e) {
      try { return JSON.parse(str); } catch (e2) { return null; }
    }
  }

  return { fmt, fmtInt, fmtMul, fmtPct, fmtTime, fmtTimeShort, $, $$, el, svgEl, clamp, lerp, rnd, pick, geoSum, geoMax, encode, decode };
})();
