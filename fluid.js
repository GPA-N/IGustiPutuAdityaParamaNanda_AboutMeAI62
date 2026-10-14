/*
 * Ember: an interactive ink-in-water background in dependency-free WebGL2, ported from the LiquidEther approach
 * (its three.js component is not loaded: the page keeps no external scripts). One velocity field is advected with
 * back-and-forth error compensation and correction (BFECC), then made incompressible by a Poisson pressure solve.
 * Colour is the speed of the flow, mapped through the theme's own tokens (--black, --red, --red-text), so the
 * swirls linger after the pointer stops and fade with the motion. The pointer, three wandering emitters and clicks
 * all push the same field; scrolling leaves it alone. Motion is always on (constitution IV).
 *
 * Progressive enhancement only: the page is complete without it. It stays off when WebGL2 float rendering is
 * missing, and pauses when the tab is hidden.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const canvas = document.getElementById('ember');
  if (!canvas) { root.dataset.fx = 'off'; return; }

  const OPT = {
    dt: 0.014,                // step per 60 Hz frame, scaled when frames are skipped
    mouseForce: 20,           // force per unit of pointer travel (LiquidEther's default)
    pointerRadius: 100,       // CSS px
    ambientRadius: 64,
    burstRadius: 46,
    velDecay: 0.996,          // per 60 Hz frame: swirls linger for a second or two
    ambientForce: 2.5,
    gain: 4,                  // flow speed to colour
    fadeRadius: 0.4,          // share of the viewport's larger side over which the cursor softens the fine detail
    peak: 0.2,                // brightness cap (calm, low contrast); tests/check-profile.mjs proves text stays above WCAG AA at this value
  };
  // Quality governor steps: grid as a fraction of the viewport, and Poisson iterations.
  const WAVE_SPAN = 1.4;       // range of uWave: the shader's radial distance (0..1) plus its 0.4 soft edge
  const LEVELS = [{ res: 0.5, iter: 24 }, { res: 0.4, iter: 18 }, { res: 0.3, iter: 12 }, { res: 0.22, iter: 8 }];
  const MAX_W = 800, MAX_H = 560;

  const VERT = `#version 300 es
    void main() {
      vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
      gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
    }`;

  const HEAD = '#version 300 es\nprecision highp float;\nprecision highp sampler2D;\nout vec4 o;\n';

  // Back-and-forth error compensation and correction: the flow is traced forth and back, and half the error is
  // removed, so the swirls keep their edges instead of blurring away.
  const ADVECT = HEAD + `
    uniform sampler2D uVel; uniform vec2 uPx; uniform vec2 uRatio; uniform float uDt; uniform float uDecay; uniform float uClamp;
    void main() {
      vec2 uv = gl_FragCoord.xy * uPx;
      vec2 s0 = uv - texture(uVel, uv).xy * uDt * uRatio;
      vec2 s1 = s0 + texture(uVel, s0).xy * uDt * uRatio;
      vec2 s2 = uv - (s1 - uv) * 0.5;
      vec2 s3 = s2 - texture(uVel, s2).xy * uDt * uRatio;
      o = vec4(clamp(texture(uVel, s3).xy * uDecay, -uClamp, uClamp), 0.0, 1.0);
    }`;

  // A smooth push, strongest at the centre and zero at the radius (LiquidEther's cursor force). Added with blending.
  const SPLAT = HEAD + `
    uniform vec2 uFbo; uniform vec2 uCenter; uniform vec4 uVal; uniform float uRadius;
    void main() {
      float d = 1.0 - min(length((gl_FragCoord.xy - uCenter * uFbo) / uRadius), 1.0);
      o = uVal * d * d;
    }`;

  const COPY = HEAD + `
    uniform sampler2D uSrc; uniform vec2 uPx;
    void main() { o = texture(uSrc, gl_FragCoord.xy * uPx); }`;

  const DIVERGENCE = HEAD + `
    uniform sampler2D uVel; uniform vec2 uPx; uniform float uDt;
    void main() {
      vec2 uv = gl_FragCoord.xy * uPx;
      float x0 = texture(uVel, uv - vec2(uPx.x, 0.0)).x;
      float x1 = texture(uVel, uv + vec2(uPx.x, 0.0)).x;
      float y0 = texture(uVel, uv - vec2(0.0, uPx.y)).y;
      float y1 = texture(uVel, uv + vec2(0.0, uPx.y)).y;
      o = vec4((x1 - x0 + y1 - y0) / 2.0 / uDt);
    }`;

  const POISSON = HEAD + `
    uniform sampler2D uPressure; uniform sampler2D uDiv; uniform vec2 uPx;
    void main() {
      vec2 uv = gl_FragCoord.xy * uPx;
      float p0 = texture(uPressure, uv + vec2(uPx.x * 2.0, 0.0)).r;
      float p1 = texture(uPressure, uv - vec2(uPx.x * 2.0, 0.0)).r;
      float p2 = texture(uPressure, uv + vec2(0.0, uPx.y * 2.0)).r;
      float p3 = texture(uPressure, uv - vec2(0.0, uPx.y * 2.0)).r;
      o = vec4((p0 + p1 + p2 + p3) / 4.0 - texture(uDiv, uv).r);
    }`;

  const PRESSURE = HEAD + `
    uniform sampler2D uPressure; uniform sampler2D uVel; uniform vec2 uPx; uniform float uDt;
    void main() {
      vec2 uv = gl_FragCoord.xy * uPx;
      float p0 = texture(uPressure, uv + vec2(uPx.x, 0.0)).r;
      float p1 = texture(uPressure, uv - vec2(uPx.x, 0.0)).r;
      float p2 = texture(uPressure, uv + vec2(0.0, uPx.y)).r;
      float p3 = texture(uPressure, uv - vec2(0.0, uPx.y)).r;
      o = vec4(texture(uVel, uv).xy - vec2(p0 - p1, p2 - p3) * 0.5 * uDt, 0.0, 1.0);
    }`;

  // Colour is the flow speed, mapped from the theme's black to its --red. --red-text stays a text colour: the
  // brightest smoke must keep text above AA (tests/check-profile.mjs).
  // Near the cursor the field is averaged over its neighbours, so fine checker squares fade out smoothly across
  // uFade pixels instead of switching off at an edge. In a theme change, the blob (uWave, uOrigin) carries the new colours.
  const SHOW = HEAD + `
    uniform sampler2D uVel; uniform vec2 uPx; uniform float uPeak; uniform float uGain;
    uniform vec3 uOld[2]; uniform vec3 uNew[2];
    uniform float uWave; uniform float uMax; uniform vec2 uOrigin;
    uniform vec2 uCursor; uniform float uFade;
    vec3 ramp(vec3 c[2], float t) { return mix(c[0], c[1], t); }
    void main() {
      vec2 uv = gl_FragCoord.xy * uPx;
      vec2 crisp = texture(uVel, uv).xy;
      vec2 blurred = (crisp * 2.0 + texture(uVel, uv + vec2(uPx.x, 0.0)).xy + texture(uVel, uv - vec2(uPx.x, 0.0)).xy
                   + texture(uVel, uv + vec2(0.0, uPx.y)).xy + texture(uVel, uv - vec2(0.0, uPx.y)).xy) / 6.0;
      vec2 v = mix(blurred, crisp, smoothstep(0.0, uFade, distance(gl_FragCoord.xy, uCursor)));
      float t = clamp(length(v) * uGain, 0.0, 1.0);
      float s = 0.6 * distance(gl_FragCoord.xy, uOrigin) / uMax;
      float tone = smoothstep(0.0, 1.0, clamp((uWave - s) / 0.4, 0.0, 1.0));
      vec3 col = mix(ramp(uOld, t), ramp(uNew, t), tone);
      float a = t * uPeak;
      o = vec4(col * a, a);   // premultiplied alpha
    }`;

  // The two colours of a theme, read from its tokens: --black and --red (as RGB 0..1, flat).
  const hexRGB = (s) => { const n = parseInt(s.trim().slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  const palCache = {};
  function palette(theme) {
    const key = theme || 'red';
    if (!palCache[key]) {
      const cs = getComputedStyle(root);
      palCache[key] = Float32Array.from(['--black', '--red'].flatMap((t) => hexRGB(cs.getPropertyValue(t))));
    }
    return palCache[key];
  }

  // ---- The simulation ----
  function createSim() {
    const gl = canvas.getContext('webgl2', {
      alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power',
    });
    if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) {
      root.dataset.fx = 'unsupported';
      return null;
    }

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('ember shader:', gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    function program(frag) {
      const f = compile(gl.FRAGMENT_SHADER, frag);
      if (!vs || !f) return null;
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, f);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.warn('ember link:', gl.getProgramInfoLog(p));
        return null;
      }
      const u = {};
      for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) {
        const name = gl.getActiveUniform(p, i).name;
        u[name] = gl.getUniformLocation(p, name);
      }
      return { p, u };
    }

    const P = {
      advect: program(ADVECT), splat: program(SPLAT), copy: program(COPY), div: program(DIVERGENCE),
      poisson: program(POISSON), pressure: program(PRESSURE), show: program(SHOW),
    };
    if (Object.values(P).some((x) => !x)) { root.dataset.fx = 'error'; return null; }

    gl.bindVertexArray(gl.createVertexArray()); // attribute-less triangle needs a bound VAO

    let w = 0, h = 0, level = 0;
    let vel, press, div;

    function target() {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { t, f };
    }
    const pair = () => {
      const a = target(), b = target();
      return { r: a, w: b, ok: Boolean(a && b), swap() { const x = this.r; this.r = this.w; this.w = x; } };
    };
    function free(x) { if (x) { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); } }
    function freePair(p) { if (p) { free(p.r); free(p.w); } }

    function resize() {
      const res = LEVELS[level].res;
      const nw = Math.max(160, Math.min(MAX_W, Math.round(window.innerWidth * res)));
      const nh = Math.max(120, Math.min(MAX_H, Math.round(window.innerHeight * res)));
      if (nw === w && nh === h && vel) return true;
      const oldVel = vel;   // copied across, so a quality step keeps the flow
      freePair(press); free(div);
      w = nw; h = nh;
      canvas.width = w; canvas.height = h;
      vel = pair(); press = pair(); div = target();
      if (oldVel) {
        if (vel.ok) pass(P.copy, vel.r, [['uSrc', oldVel.r]], (u) => gl.uniform2f(u.uPx, 1 / w, 1 / h));
        freePair(oldVel);
      }
      return Boolean(vel.ok && press.ok && div);
    }
    if (!resize()) { root.dataset.fx = 'unsupported'; return null; }
    root.dataset.fxLevel = String(level);

    function pass(prog, out, bindings, setUniforms) {
      gl.useProgram(prog.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.f : null);
      gl.viewport(0, 0, w, h);
      bindings.forEach(([name, tex], i) => {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, tex.t);
        gl.uniform1i(prog.u[name], i);
      });
      setUniforms(prog.u);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // Push the field at (x, y) (0..1 of the viewport) with a 2-value force and a radius in CSS px.
    function push(x, y, fx, fy, cssRadius) {
      pass(P.splat, vel.r, [], (u) => {
        gl.uniform2f(u.uFbo, w, h);
        gl.uniform2f(u.uCenter, x, y);
        gl.uniform4f(u.uVal, fx, fy, 0, 0);
        gl.uniform1f(u.uRadius, Math.max(6, cssRadius * (w / window.innerWidth)));
      });
    }

    // ---- Input: pointer, click bursts, scroll wake ----
    const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, ox: 0.5, oy: 0.5 };
    const bursts = [];
    let ptrSeen = false;
    let minFrame = 1000 / 60;
    window.addEventListener('pointermove', (e) => {
      ptrSeen = true;
      ptr.tx = e.clientX / window.innerWidth;
      ptr.ty = 1 - e.clientY / window.innerHeight;
    }, { passive: true });
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') minFrame = 1000 / 30; // touch devices get half the frames
      bursts.push({ x: e.clientX / window.innerWidth, y: 1 - e.clientY / window.innerHeight });
      if (bursts.length > 4) bursts.shift();
    }, { passive: true });
    window.addEventListener('resize', () => { if (!resize()) { stop(); root.dataset.fx = 'unsupported'; } });

    const ambient = (i, t) => [
      0.5 + 0.36 * Math.sin(t * 0.07 + i * 2.1) + 0.1 * Math.sin(t * 0.17 + i * 1.3),
      0.5 + 0.30 * Math.sin(t * 0.06 + i * 1.7 + 1) + 0.1 * Math.sin(t * 0.15 + i * 2.9),
    ];

    // ---- Frame loop with a quality governor ----
    let raf = 0, last = 0, avg = 16.7, warm = 0;
    // Colour wave from motion.js (detail.ms long, eased like the blob). Without an event the colours stay at the theme's.
    let wave = null; // { t0, from, x, y, ms }: from = the palette before the switch
    document.addEventListener('colour-theme', (e) => {
      const d = e.detail;
      wave = { t0: performance.now(), from: palette(root.dataset.theme), x: d.x, y: d.y, ms: d.ms };
    });
    const t0 = performance.now();

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (now - last < minFrame - 2) return;
      const elapsed = last ? now - last : 16.7;
      last = now;

      if (wave) warm = 0;   // the colour wave is a one-off cost, not a reason to lower quality
      // Governor: if frames take much longer than intended, drop one quality level (smaller grid, fewer solves).
      if (elapsed < 250) avg = avg * 0.92 + elapsed * 0.08;
      if (++warm > 45 && avg > Math.max(24, minFrame * 1.4) && level < LEVELS.length - 1) {
        level++; warm = 0; avg = minFrame;
        root.dataset.fxLevel = String(level);
        if (!resize()) { stop(); root.dataset.fx = 'unsupported'; return; }
      }

      const k = Math.min(Math.max(elapsed / (1000 / 60), 0.5), 3); // step length in 60 Hz frames
      const dt = OPT.dt * k;
      const time = (now - t0) / 1000;
      const px = [1 / w, 1 / h];
      const ratio = [Math.max(w, h) / w, Math.max(w, h) / h];

      // 1. Move the flow (BFECC), with a little decay so old swirls fade.
      pass(P.advect, vel.w, [['uVel', vel.r]], (u) => {
        gl.uniform2f(u.uPx, px[0], px[1]); gl.uniform2f(u.uRatio, ratio[0], ratio[1]);
        gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDecay, OPT.velDecay ** k); gl.uniform1f(u.uClamp, 2);
      });
      vel.swap();

      // 2. Add force: pointer, three wandering emitters, click bursts.
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);

      const ease = 1 - Math.exp(-elapsed / 70);
      ptr.x += (ptr.tx - ptr.x) * ease;
      ptr.y += (ptr.ty - ptr.y) * ease;
      let dx = ptr.x - ptr.ox, dy = ptr.y - ptr.oy;
      ptr.ox = ptr.x; ptr.oy = ptr.y;
      const mag = Math.hypot(dx, dy);
      if (mag > 0.08) { dx *= 0.08 / mag; dy *= 0.08 / mag; }
      if (mag > 1e-4) push(ptr.x, ptr.y, dx * OPT.mouseForce, dy * OPT.mouseForce, OPT.pointerRadius);

      for (let i = 0; i < 3; i++) {
        const [x, y] = ambient(i, time);
        const [x0, y0] = ambient(i, time - 0.1);
        push(x, y, (x - x0) * 10 * OPT.ambientForce, (y - y0) * 10 * OPT.ambientForce, OPT.ambientRadius);
      }

      while (bursts.length) {
        const b = bursts.pop();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + b.x * 6;
          const bx = b.x + Math.cos(a) * 0.015, by = b.y + Math.sin(a) * 0.015 * (window.innerWidth / window.innerHeight);
          push(bx, by, Math.cos(a) * 0.7, Math.sin(a) * 0.7 * (window.innerWidth / window.innerHeight), OPT.burstRadius);
        }
      }

      gl.disable(gl.BLEND);

      // 3. Make the flow incompressible: divergence, pressure solve, subtract the pressure gradient.
      pass(P.div, div, [['uVel', vel.r]], (u) => { gl.uniform2f(u.uPx, px[0], px[1]); gl.uniform1f(u.uDt, dt); });
      for (let i = 0; i < LEVELS[level].iter; i++) {
        pass(P.poisson, press.w, [['uPressure', press.r], ['uDiv', div]], (u) => { gl.uniform2f(u.uPx, px[0], px[1]); });
        press.swap();
      }
      pass(P.pressure, vel.w, [['uPressure', press.r], ['uVel', vel.r]], (u) => {
        gl.uniform2f(u.uPx, px[0], px[1]); gl.uniform1f(u.uDt, dt);
      });
      vel.swap();

      // 4. Draw. The blob takes the new colours; the copy of the old colours sits outside it.
      const cur = palette(root.dataset.theme);
      let old = cur, waveT = 0;
      const ox = wave ? wave.x * canvas.width / innerWidth : 0;
      const oy = wave ? canvas.height - wave.y * canvas.height / innerHeight : 0;
      const maxD = Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy));
      if (wave) {
        old = wave.from;
        const p = Math.min(1, (now - wave.t0) / wave.ms);
        waveT = WAVE_SPAN * p * p * (3 - 2 * p);   // same ease as the blob
        if (p >= 1) wave = null;
      }
      const cursor = ptrSeen ? [ptr.x * w, ptr.y * h] : [-1e6, -1e6];
      pass(P.show, null, [['uVel', vel.r]], (u) => {
        gl.uniform2f(u.uPx, px[0], px[1]); gl.uniform1f(u.uPeak, OPT.peak); gl.uniform1f(u.uGain, OPT.gain);
        gl.uniform3fv(u['uOld[0]'], old); gl.uniform3fv(u['uNew[0]'], cur);
        gl.uniform1f(u.uWave, waveT); gl.uniform1f(u.uMax, maxD); gl.uniform2f(u.uOrigin, ox, oy);
        gl.uniform2f(u.uCursor, cursor[0], cursor[1]); gl.uniform1f(u.uFade, OPT.fadeRadius * Math.max(w, h));
      });

      if (!root.classList.contains('fx-live') && time > 0.3) {
        root.classList.add('fx-live');
        root.dataset.fx = 'live';
      }
    }

    function start() { last = 0; warm = 0; if (!raf) raf = requestAnimationFrame(frame); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      stop();
      root.classList.remove('fx-live');
      root.dataset.fx = 'lost';
    });

    return { start };
  }

  const sim = createSim();
  if (sim && !document.hidden) { root.dataset.fx = 'starting'; sim.start(); }
})();
