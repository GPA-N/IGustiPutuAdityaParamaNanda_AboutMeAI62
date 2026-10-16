/*
 * Motion: the page's interactions, in dependency-free JavaScript. Motion is always on (constitution IV, FR-016).
 *
 *   press-in cards   the spot under the pointer sinks, the far edge lifts, springs back on leave
 *   spin portrait    drag to rotate in 3D, flick to spin with exponential decay, settles on the nearest face
 *   split headings   every letter fades in, slides up and loses its blur
 *   scroll reveal    blocks below the first screen rise in once
 *   magnetic CTAs    buttons lean toward the pointer
 *   nav ink          a red line slides under the current section
 *
 * Progressive enhancement only: with scripts off, every element is plain and visible. One animation loop runs
 * only while something is moving.
 */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- One loop for every spring; it sleeps when the set is empty ----
  const live = new Set();
  let raf = 0;
  let last = 0;
  function tick(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    live.forEach((o) => { if (!o.step(dt)) live.delete(o); });
    raf = live.size ? requestAnimationFrame(tick) : 0;
  }
  function wake(o) {
    live.add(o);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  // Damped spring; returns true while it is still moving.
  function spring(s, target, k, c, dt) {
    s.v += (-k * (s.x - target) - c * s.v) * dt;
    s.x += s.v * dt;
    return Math.abs(s.x - target) > 0.0005 || Math.abs(s.v) > 0.005;
  }

  // ---- Press-in cards and contact links ----
  function pressable(el) {
    const px = { x: 0, v: 0 }, py = { x: 0, v: 0 }, pr = { x: 0, v: 0 };
    let tx = 0, ty = 0, tp = 0, down = false;
    const o = {
      step(dt) {
        const a = spring(px, tx, 170, 15, dt);
        const b = spring(py, ty, 170, 15, dt);
        const c = spring(pr, tp, 210, 17, dt);
        el.style.setProperty('--px', px.x.toFixed(3));
        el.style.setProperty('--py', py.x.toFixed(3));
        el.style.setProperty('--press', clamp(pr.x, 0, 1.15).toFixed(3));
        return a || b || c;
      },
    };
    const aim = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      tx = clamp((x / r.width) * 2 - 1, -1, 1);
      ty = clamp((y / r.height) * 2 - 1, -1, 1);
      el.style.setProperty('--mx', `${x.toFixed(1)}px`);
      el.style.setProperty('--my', `${y.toFixed(1)}px`);
    };
    const rest = () => { tx = 0; ty = 0; tp = 0; down = false; wake(o); };
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      aim(e);
      tp = down ? 1 : 0.55;
      wake(o);
    }, { passive: true });
    el.addEventListener('pointerdown', (e) => { aim(e); down = true; tp = 1; wake(o); }, { passive: true });
    const up = (e) => { down = false; tp = e.pointerType === 'touch' ? 0 : 0.55; if (!tp) { tx = 0; ty = 0; } wake(o); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', rest);
    el.addEventListener('pointerleave', rest);
  }
  $('.card, .contact a').forEach(pressable);

  // ---- Magnetic buttons ----
  if (finePointer) {
    $('.shiny, .pill-btn').forEach((el) => {
      const sx = { x: 0, v: 0 }, sy = { x: 0, v: 0 };
      let tx = 0, ty = 0;
      const o = {
        step(dt) {
          const a = spring(sx, tx, 190, 16, dt);
          const b = spring(sy, ty, 190, 16, dt);
          el.style.setProperty('--tx', `${sx.x.toFixed(2)}px`);
          el.style.setProperty('--ty', `${sy.x.toFixed(2)}px`);
          return a || b;
        },
      };
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = clamp((e.clientX - (r.left + r.width / 2)) * 0.22, -8, 8);
        ty = clamp((e.clientY - (r.top + r.height / 2)) * 0.22, -6, 6);
        wake(o);
      }, { passive: true });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; wake(o); });
    });
  }

  // ---- Colour theme: red to steel and back. A nanobot swarm spreads from the centre of the portrait card.
  // The page takes the new theme at once, and a frozen copy of the old look sits on top, clipped to everything outside
  // the swarm's blob. The blob's edge is a skin of tiny metal squares with a lit rim, and loose bots stream ahead of it.
  // The page gradient has its own copy under the fluid canvas, so the smoke stays visible. No view transitions.
  const BLOB_MS = 1500;        // time for the blob to cover the viewport
  const CELL = 8;              // skin square pitch, CSS px
  const INNER = 40;            // skin depth behind the edge, px
  const OUTER = 34;            // how far loose bots drift ahead of the edge, px
  const BOTS = 900;            // loose bots
  let wave = null;             // { raf, wrap, bgWrap, mesh, live } while a wave runs

  function stopWave() {
    if (!wave) return;
    cancelAnimationFrame(wave.raf);
    wave.wrap.remove(); wave.bgWrap.remove(); wave.mesh.remove();
    wave.live.forEach((el) => { el.style.clipPath = ''; });
    wave = null;
  }

  function colourWave(cx, cy, to) {
    const root = document.documentElement;
    const w = root.clientWidth, h = innerHeight;
    const far = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    const rMax = far * 1.25;   // the edge wobbles by up to 15%, so this still clears the farthest corner

    // The old look: a copy of the page under the old tokens, without animations, canvases or ids
    const wrap = document.createElement('div');
    wrap.className = 'theme-old'; wrap.inert = true; wrap.setAttribute('aria-hidden', 'true');
    const bgWrap = document.createElement('div');            // the page gradient, kept under the fluid canvas
    bgWrap.className = 'theme-old-bg'; bgWrap.setAttribute('aria-hidden', 'true');
    bgWrap.append(document.querySelector('.bg-gradient').cloneNode(true));
    wrap.dataset.theme = bgWrap.dataset.theme = root.dataset.theme || 'red';   // the copy keeps the old theme's tokens
    const page = document.createElement('div');
    page.className = 'theme-old-page';
    const twin = new Map();                                  // original element -> its copy
    const pair = (o, c) => { twin.set(o, c); [...o.children].forEach((oc, i) => pair(oc, c.children[i])); };
    for (const el of document.body.children) if (!/^(CANVAS|SCRIPT)$/.test(el.tagName)) { const c = el.cloneNode(true); pair(el, c); page.append(c); }
    page.querySelectorAll('canvas, script, .stars, .bg-gradient').forEach((el) => el.remove());
    page.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    wrap.append(page);
    document.body.append(bgWrap, wrap);
    // A copy starts every CSS animation afresh: put each on its original's clock, and stop the ones the original has finished
    const copies = page.getAnimations({ subtree: true });
    const running = document.getAnimations();
    for (const ca of copies) {
      const oa = running.find((a) => twin.get(a.effect.target) === ca.effect.target && a.animationName === ca.animationName && a.effect.pseudoElement === ca.effect.pseudoElement);
      if (oa) ca.currentTime = oa.currentTime; else ca.cancel();
    }
    // The real page (new theme) shows only inside the blob and the copy (old theme) only outside it, so nothing stacks
    const live = [...document.body.children].filter((el) => !/^(CANVAS|SCRIPT)$/.test(el.tagName) && !el.matches('.bg, .theme-old, .theme-old-bg, .nano-mesh'));

    const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
    const dist = new Float32Array(cols * rows), ang = new Float32Array(cols * rows), jit = new Float32Array(cols * rows);
    for (let k = 0; k < dist.length; k++) {
      const x = (k % cols + 0.5) * CELL - cx, y = (Math.floor(k / cols) + 0.5) * CELL - cy;
      dist[k] = Math.hypot(x, y); ang[k] = Math.atan2(y, x);
      jit[k] = Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1;
    }
    const bot = Array.from({ length: BOTS }, () => ({ a: Math.random() * 6.2832, p: Math.random(), s: 2 + Math.random() * 3, r: Math.random() * 6.2832 }));
    const mesh = document.createElement('canvas');
    mesh.className = 'nano-mesh'; mesh.width = w; mesh.height = h;
    document.body.append(mesh);
    const mx = mesh.getContext('2d');

    const ph = [0, 1, 2, 3].map(() => Math.random() * 6.28);
    root.dataset.theme = to;
    const accent = getComputedStyle(root).getPropertyValue('--red-text').trim();   // the new theme's lit colour
    const skin = getComputedStyle(mesh).color;
    wave = { raf: 0, wrap, bgWrap, mesh, live };
    const start = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - start) / BLOB_MS);
      const R = rMax * t * t * (3 - 2 * t);
      // Radius at angle a: a circle with slow lobes, so the edge looks like a blob, not a ring
      const edge = (a) => R * (1 + 0.06 * Math.sin(2 * a + ph[0] + t * 2) + 0.04 * Math.sin(3 * a + ph[1] - t * 3)
        + 0.03 * Math.sin(5 * a + ph[2] + t * 4) + 0.015 * Math.sin(9 * a + ph[3] - t * 5));
      let pts = '';
      const ex = [], ey = [];
      for (let i = 0; i < 96; i++) {
        const a = i / 96 * 6.2832, r = edge(a);
        ex.push(cx + Math.cos(a) * r); ey.push(cy + Math.sin(a) * r);
        pts += `, ${ex[i].toFixed(1)}px ${ey[i].toFixed(1)}px`;
      }
      page.style.top = -scrollY + 'px';
      // Whole viewport minus the blob (even-odd): the old look shows only outside it
      wrap.style.clipPath = bgWrap.style.clipPath = `polygon(evenodd, 0 0, ${w}px 0, ${w}px ${h}px, 0 ${h}px, 0 0${pts}, ${ex[0].toFixed(1)}px ${ey[0].toFixed(1)}px)`;
      for (const el of live) {   // the real page: only the blob, in each element's own coordinates
        const r = el.getBoundingClientRect();
        el.style.clipPath = 'polygon(' + ex.map((x, i) => `${(x - r.left).toFixed(1)}px ${(ey[i] - r.top).toFixed(1)}px`).join(',') + ')';
      }

      mx.clearRect(0, 0, w, h);
      if (R > 2) {
        // Skin: dark metal squares with a bevel, dense at the edge and thinning inward, lit rim on the outermost row
        const s = CELL - 1.5;
        for (let k = 0; k < dist.length; k++) {
          if (Math.abs(dist[k] - R) > R * 0.16 + INNER) continue;
          const depth = edge(ang[k]) - dist[k];
          if (depth < -2 || depth > INNER || jit[k] > Math.pow(1 - depth / INNER, 0.8)) continue;
          const x = (k % cols) * CELL + (CELL - s) / 2, y = Math.floor(k / cols) * CELL + (CELL - s) / 2;
          mx.fillStyle = depth < 5 ? accent : skin;
          mx.globalAlpha = depth < 5 ? 0.95 : 0.88;
          mx.fillRect(x, y, s, s);
          if (depth >= 5) { mx.fillStyle = accent; mx.globalAlpha = 0.55; mx.fillRect(x, y, s, 1); mx.fillRect(x, y, 1, s); }
        }
        // Loose bots stream outward ahead of the edge, spinning, fading in and out
        mx.fillStyle = accent;
        for (const b of bot) {
          const f = (b.p + t * 1.6) % 1, r = edge(b.a) + f * OUTER;
          mx.globalAlpha = Math.sin(Math.PI * f) * 0.9;
          const c = Math.cos(b.r + f * 3), sn = Math.sin(b.r + f * 3);
          mx.setTransform(c, sn, -sn, c, cx + Math.cos(b.a) * r, cy + Math.sin(b.a) * r);
          mx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s);
        }
        mx.setTransform(1, 0, 0, 1, 0, 0);
        // Glowing seam along the edge
        mx.globalAlpha = 1; mx.strokeStyle = accent; mx.lineWidth = 1.5; mx.shadowColor = accent; mx.shadowBlur = 12;
        mx.beginPath();
        ex.forEach((x, i) => (i ? mx.lineTo(x, ey[i]) : mx.moveTo(x, ey[i])));
        mx.closePath(); mx.stroke(); mx.shadowBlur = 0;
      }
      if (t < 1) wave.raf = requestAnimationFrame(frame);
      else stopWave();
    };
    frame(start);
  }

  function switchTone() {
    stopWave();                                             // a second tap ends the running wave, then starts a new one
    const root = document.documentElement;
    const to = root.dataset.theme === 'steel' ? 'red' : 'steel';
    const card = document.querySelector('.avatar').getBoundingClientRect();
    const cx = card.left + card.width / 2, cy = card.top + card.height / 2;
    document.dispatchEvent(new CustomEvent('colour-theme', { detail: { x: cx, y: cy, to: to === 'steel' ? 1 : 0, ms: BLOB_MS } }));
    colourWave(cx, cy, to);
  }

  // ---- Spinnable portrait ----
  const avatar = $('.avatar')[0];
  const spin = avatar && avatar.querySelector('.spin');
  if (spin) {
    const FRICTION = 1.8;        // 1/s; speed falls to 1/e of itself in about half a second
    const MAX_SPEED = 1440;      // deg/s
    const SETTLE_BELOW = 240;    // deg/s; slower than this, a spring pulls it onto a face
    const PER_PX = 0.9;          // degrees of rotation per dragged pixel
    let ry = 0, rx = 0, vy = 0, vx = 0;
    let bias = 0;                // temporary resting angle for the first-load hint
    let aim = null;              // face angle (0 front, 180 back) it is settling to, once slow enough
    let dragging = false, touched = false;
    let px0 = 0, py0 = 0, t0 = 0;
    let trail = [];              // recent pointer samples [x, y, ms]; release speed is measured over the last 100 ms
    let onMark = false, downX = 0, downY = 0; // a press that starts on the diamond and does not move is a tap

    const render = () => {
      spin.style.setProperty('--ry', ry.toFixed(2));
      spin.style.setProperty('--rx', rx.toFixed(2));
      avatar.style.setProperty('--glint', `${(50 + Math.sin((ry * Math.PI) / 180) * 58).toFixed(1)}%`);
    };
    const o = {
      step(dt) {
        if (dragging) { render(); return true; }
        ry += vy * dt;
        vy *= Math.exp(-FRICTION * dt);
        // Once it has slowed down, pick one face angle (front or back) and spring to it (latched, so it cannot be chased).
        if (aim === null && Math.abs(vy) < SETTLE_BELOW) aim = Math.round((ry + vy * 0.4) / 180) * 180 + bias;
        if (aim !== null) vy += (-170 * (ry - aim) - 16 * vy) * dt;
        rx += vx * dt;
        vx += (-170 * rx - 20 * vx) * dt;
        const still = aim !== null && Math.abs(vy) < 0.05 && Math.abs(ry - aim) < 0.05 && Math.abs(vx) < 0.05 && Math.abs(rx) < 0.05;
        if (still) { ry = aim; rx = 0; vy = 0; vx = 0; }
        render();
        return !still;
      },
    };
    const grab = () => { touched = true; bias = 0; aim = null; };

    avatar.addEventListener('pointerdown', (e) => {
      grab();
      dragging = true;
      avatar.classList.add('dragging');
      avatar.setPointerCapture(e.pointerId);
      px0 = e.clientX; py0 = e.clientY; t0 = performance.now();
      trail = [[px0, py0, t0]];
      downX = px0; downY = py0; onMark = e.target.classList.contains('back-mark');
      vy = 0; vx = 0;
      wake(o);
    });
    avatar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - px0, dy = e.clientY - py0;
      px0 = e.clientX; py0 = e.clientY; t0 = now;
      ry += dx * PER_PX;
      rx = clamp(rx - dy * PER_PX, -70, 70);
      trail.push([px0, py0, now]);
      while (trail.length > 2 && now - trail[0][2] > 100) trail.shift();
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      avatar.classList.remove('dragging');
      const a = trail[0], b = trail[trail.length - 1];
      const span = (b[2] - a[2]) / 1000;
      if (performance.now() - t0 > 90 || span < 0.01) { vy = 0; vx = 0; } // paused before letting go: no flick
      else {
        vy = clamp(((b[0] - a[0]) * PER_PX) / span, -MAX_SPEED, MAX_SPEED);
        vx = clamp((-(b[1] - a[1]) * PER_PX) / span, -MAX_SPEED / 3, MAX_SPEED / 3);
      }
      // A tap on the diamond switches the theme and holds the portrait on its back face, so the diamond stays clickable.
      if (onMark && Math.hypot(b[0] - downX, b[1] - downY) < 6) { vy = 0; vx = 0; aim = ry; switchTone(); }
      else aim = null;
      wake(o);
    };
    avatar.addEventListener('pointerup', release);
    avatar.addEventListener('pointercancel', release);

    avatar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (!e.repeat) switchTone(); return; }
      const kick = { ArrowLeft: [-720, 0], ArrowRight: [720, 0], ArrowUp: [0, 360], ArrowDown: [0, -360] }[e.key];
      if (!kick) return;
      e.preventDefault();
      grab();
      vy = clamp(vy + kick[0], -MAX_SPEED, MAX_SPEED);
      vx = clamp(vx + kick[1], -MAX_SPEED / 3, MAX_SPEED / 3);
      wake(o);
    });

    // One small turn after the page settles, so the portrait shows that it moves.
    window.setTimeout(() => {
      if (touched) return;
      bias = 18; aim = null; wake(o);
      window.setTimeout(() => { bias = 0; aim = null; wake(o); }, 420);
    }, 2200);
  }

  // ---- Split headings: letter by letter ----
  function splitText(h) {
    const label = h.textContent.replace(/\s+/g, ' ').trim();
    let n = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const word = document.createElement('span');
            word.className = 'sw';
            word.setAttribute('aria-hidden', 'true');
            Array.from(part).forEach((glyph) => {
              const ch = document.createElement('span');
              ch.className = 'ch';
              ch.style.setProperty('--i', String(n++));
              ch.textContent = glyph;
              word.append(ch);
            });
            frag.append(word);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName.toLowerCase() !== 'svg') {
          walk(c);
        }
      });
    };
    h.setAttribute('aria-label', label);
    walk(h);
    h.style.setProperty('--st', `${Math.min(28, 900 / Math.max(n, 1)).toFixed(1)}ms`);
    h.classList.add('split');
    return h;
  }
  const headings = $('h1, h2, h3, .col-title').map(splitText);
  const heroTitle = document.getElementById('name');
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => window.setTimeout(r, 1200))]).then(() => {
    if (heroTitle) heroTitle.classList.add('go');
  });
  const headingIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('go');
      headingIO.unobserve(en.target);
    });
  }, { threshold: 0.4 });
  headings.forEach((h) => { if (h !== heroTitle) headingIO.observe(h); });

  // ---- Scroll reveal for blocks below the first screen ----
  const vh = window.innerHeight;
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in');
      revealIO.unobserve(el);
      const done = (ev) => {
        if (ev.propertyName !== 'translate') return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('rv', 'in');
        el.style.removeProperty('--rv-d');
      };
      el.addEventListener('transitionend', done);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $('.section-head p, .card, .contact li, .rows li, .interests li, .banner .big, .closing p, .closing .shiny').forEach((el) => {
    if (el.getBoundingClientRect().top < vh) return;
    const siblings = el.parentElement ? Array.from(el.parentElement.children) : [el];
    el.style.setProperty('--rv-d', `${Math.min(siblings.indexOf(el), 5) * 70}ms`);
    el.classList.add('rv');
    revealIO.observe(el);
  });

  // ---- Border spin of the shiny buttons pauses while they are off screen ----
  const spinIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle('off', !en.isIntersecting));
  });
  document.querySelectorAll('.shiny').forEach((el) => spinIO.observe(el));

  // ---- In-page links glide. Browsers skip CSS smooth scrolling when the OS has animation effects off, so do it here ----
  const GLIDE_MS = { min: 350, max: 1100, perPx: 0.25 };
  let glide = 0;
  const stopGlide = () => { cancelAnimationFrame(glide); glide = 0; };
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, stopGlide, { passive: true }));
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    stopGlide();
    const pad = (el) => parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const stop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const from = scrollY;
    const to = Math.max(0, Math.min(from + target.getBoundingClientRect().top - pad(target) - stop, document.documentElement.scrollHeight - innerHeight));
    const ms = Math.min(GLIDE_MS.max, GLIDE_MS.min + Math.abs(to - from) * GLIDE_MS.perPx);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      scrollTo({ top: from + (to - from) * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), behavior: 'instant' });
      glide = t < 1 ? requestAnimationFrame(step) : 0;
    };
    glide = requestAnimationFrame(step);
    history.pushState(null, '', a.hash);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  // ---- Nav ink: a red line under the link of the section in view ----
  const links = $('.nav-links a[href^="#"]');
  const nav = document.querySelector('.nav-links');
  if (nav && links.length) {
    const ink = document.createElement('span');
    ink.className = 'nav-ink';
    ink.setAttribute('aria-hidden', 'true');
    nav.append(ink);
    let current = null;
    const place = () => {
      const link = links.find((a) => a.getAttribute('href') === `#${current}`);
      links.forEach((a) => a.classList.toggle('cur', a === link));
      if (!link || !nav.offsetWidth) { ink.classList.remove('on'); return; }
      ink.style.setProperty('--x', `${link.offsetLeft}px`);
      ink.style.setProperty('--w', `${link.offsetWidth}px`);
      ink.classList.add('on');
    };
    const alias = { skills: 'training' };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const id = alias[en.target.id] || en.target.id;
        if (en.isIntersecting) { current = id; place(); }
        else if (current === id) { current = null; place(); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $('main > section[id]').forEach((s) => spy.observe(s));
    window.addEventListener('resize', place);
  }
})();
