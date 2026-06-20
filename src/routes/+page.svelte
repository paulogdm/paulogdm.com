<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Icon from '@iconify/svelte';
  import sunIcon           from '@iconify-icons/lucide/sun';
  import moonIcon          from '@iconify-icons/lucide/moon';
  import mailIcon          from '@iconify-icons/lucide/mail';
  import calendarIcon      from '@iconify-icons/lucide/calendar';
  import githubIcon        from '@iconify-icons/simple-icons/github';
  import linkedinIcon      from '@iconify-icons/simple-icons/linkedin';
  import xIcon             from '@iconify-icons/simple-icons/x';
  import stackoverflowIcon from '@iconify-icons/simple-icons/stackoverflow';

  let lights  = $state(false);
  let sparkEl = null; // cached after mount — avoids repeated querySelector calls

  // Accessibility: users who request reduced motion get no canvas easter eggs
  // at all. Several variants (matrix, glitch) strobe rapidly, which is a
  // genuine photosensitivity/vestibular risk. Checked live at trigger time so
  // it tracks changes to the OS setting without a reload.
  function prefersReducedMotion() {
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ── Role ticker ───────────────────────────────────────────────────────────
  // The subtitle under "paulogdm" cross-fades through the many hats I wear, in
  // random order. Add, remove, or reorder these freely — the ticker shuffles
  // them and never repeats one of the last few. Keep each short enough to sit on
  // one line on mobile.
  const ROLES = [
    'Dev',
    'Technical Account Manager',
    'Technical CSM',
    'Solutions Engineer',
    'GTM Engineer',
    'Software Engineer',
    'Agent Whisper',
    'Hardware + Software Hobbyist',
    'Success Engineer',
    'Customer-1st Engineer',
  ];

  // Personal roles — shown rarely and never two within PERSONAL_COOLDOWN of each
  // other, so they read as the occasional wink rather than part of the rotation.
  const PERSONAL_ROLES = [
    '🚗 Car Fan',
    '✌️ Chill Guy',
    '🗺️ Traveller',
    '🛍️ Professional Shopper',
  ];

  // Every possible role — used only to size the slot, so the visible box is wide
  // enough for the longest of either list and never resizes between roles.
  const ALL_ROLES = [...ROLES, ...PERSONAL_ROLES];

  const ROLE_DWELL        = 2600;  // ms a role rests before the next one fades in
  const ROLE_NO_REPEAT    = 3;     // professional roles: avoid the last N shown
  const PERSONAL_CHANCE   = 0.12;  // ~1 in 8 eligible cycles picks a personal role
  const PERSONAL_COOLDOWN = 30000; // ms before another personal role may appear

  let role           = $state(ROLES[0]);   // 'Dev' — always shown first on load
  let recentPro      = [ROLES[0]];         // sliding window of recent professional roles
  let lastPersonal   = '';                 // last personal role (avoid back-to-back)
  let lastPersonalAt = -PERSONAL_COOLDOWN; // so a personal role is eligible from the start

  // Pick a professional role that isn't one of the last ROLE_NO_REPEAT shown.
  function pickProfessional() {
    const blockCount = Math.min(ROLE_NO_REPEAT, ROLES.length - 1);
    const blocked    = new Set(recentPro.slice(-blockCount));
    const candidates = ROLES.filter((r) => !blocked.has(r));
    const next       = candidates[Math.floor(Math.random() * candidates.length)];
    recentPro = [...recentPro, next].slice(-ROLE_NO_REPEAT);
    return next;
  }

  // Advance the subtitle. Mostly professional roles; occasionally — and at most
  // once per PERSONAL_COOLDOWN — a personal one slips in. Skipped while the tab
  // is hidden: rAF (and the fade) is paused there, so a queued change would just
  // pile up off-screen — same reason the canvas renderer pauses on hide.
  function rollToNextRole() {
    if (document.hidden) return;
    const now    = performance.now();
    const cooled = now - lastPersonalAt >= PERSONAL_COOLDOWN;
    if (cooled && Math.random() < PERSONAL_CHANCE) {
      const pool = PERSONAL_ROLES.filter((r) => r !== lastPersonal);
      role           = pool[Math.floor(Math.random() * pool.length)];
      lastPersonal   = role;
      lastPersonalAt = now;
    } else {
      role = pickProfessional();
    }
  }

  // Cross-fade timing: the outgoing role fades out, then the incoming one fades
  // in (the in: delay matches the out: duration, so they don't overlap/ghost).
  const FADE_OUT = 250;
  const FADE_IN  = 320;

  // ── Photo drag resistance ────────────────────────────────────────────────────
  let isDragging  = $state(false);
  let photoX      = $state(0);
  let photoY      = $state(0);
  let dragOriginX = 0;
  let dragOriginY = 0;

  // tanh gives natural rubber-band feel: small pulls move freely, hard pulls
  // hit a soft wall. Max visible displacement is ±MAX_PX regardless of drag.
  const MAX_PX = 24;
  const TENSION = 85; // lower = stiffer

  function resist(v) {
    return Math.tanh(v / TENSION) * MAX_PX;
  }

  function onPhotoDragStart(e) {
    isDragging  = true;
    dragOriginX = e.clientX;
    dragOriginY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPhotoMove(e) {
    if (!isDragging) return;
    photoX = resist(e.clientX - dragOriginX);
    photoY = resist(e.clientY - dragOriginY);
  }

  function onPhotoRelease() {
    isDragging = false;
    photoX = 0;
    photoY = 0;
  }

  // Derived style — applied inline so transition can be toggled per-state
  let photoStyle = $derived(
    isDragging
      ? `transform: translate(${photoX}px, ${photoY}px) perspective(500px) rotateX(${(-photoY * 0.55).toFixed(2)}deg) rotateY(${(photoX * 0.55).toFixed(2)}deg) scale(1.04); transition: transform 0s; cursor: grabbing;`
      : 'cursor: grab;'
  );
  // ── End photo drag resistance ─────────────────────────────────────────────

  // Cross-tab theme sync. Cookies are already shared across same-origin tabs,
  // so a toggle in one tab leaves the cookie correct everywhere — the channel
  // just nudges the other tabs to re-render. The sender never receives its own
  // message, so applyTheme() here can't loop.
  let themeChannel = null;

  // Single code path for "make the UI reflect `dark`": document classes (which
  // the canvas renderer reads live) + reactive state (the toggle icon).
  function applyTheme(dark) {
    lights = dark;
    document.documentElement.classList.toggle('theme-dark', dark);
    document.documentElement.classList.toggle('theme-light', !dark);
  }

  function changeBackground() {
    applyTheme(!lights);
    // SameSite=Lax: this is a first-party preference cookie, never sent cross-site.
    document.cookie = `lights=${lights ? 'on' : 'off'}; path=/; max-age=31536000; SameSite=Lax`;
    // Notify other tabs/windows; they apply the class + state without re-writing
    // the cookie or re-broadcasting.
    themeChannel?.postMessage(lights);
  }

  onMount(() => {
    sparkEl = document.querySelector('.tl-spark');

    // The blocking script in app.html already resolved the theme (cookie →
    // system preference) and applied the class before first paint. Sync our
    // reactive state from that single source of truth rather than re-deriving it.
    lights = document.documentElement.classList.contains('theme-dark');

    // Subscribe to theme toggles from other tabs/windows of this origin.
    themeChannel = new BroadcastChannel('theme');
    themeChannel.onmessage = (e) => applyTheme(e.data);

    let keyBuf = '';
    const KONAMI_SEQ = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
    let konamiIdx = 0;

    function onKey(e) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (prefersReducedMotion()) return; // no keyboard easter eggs under reduced motion

      // Konami code — tracked separately since arrow keys aren't single chars
      const k = e.key.toLowerCase();
      if (k === KONAMI_SEQ[konamiIdx]) {
        konamiIdx++;
        if (konamiIdx === KONAMI_SEQ.length) {
          konamiIdx = 0;
          spawnKonamiWave();
          return;
        }
      } else {
        konamiIdx = k === KONAMI_SEQ[0] ? 1 : 0;
      }

      keyBuf = (keyBuf + k).slice(-6);
      if (keyBuf.endsWith('sonar'))  { keyBuf = ''; triggerAllWaves(); return; }
      if (keyBuf.endsWith('matrix')) {
        keyBuf = '';
        const rect = sparkEl.getBoundingClientRect();
        spawnWave(rect.left + rect.width / 2, rect.top + rect.height / 2, 'matrix');
        return;
      }
      if (keyBuf.endsWith('vercel') || keyBuf.endsWith('clerk')) {
        const variant = keyBuf.endsWith('vercel') ? 'vercel' : 'clerk';
        keyBuf = '';
        const rect = sparkEl.getBoundingClientRect();
        spawnWave(rect.left + rect.width / 2, rect.top + rect.height / 2, variant);
      }
    }
    window.addEventListener('keydown', onKey);

    // Roll the role subtitle on a timer. The first role (ROLES[0]) fades in with
    // the name; the timer then rolls through the rest at random. Reduced-motion
    // users keep that single static role and no cycling.
    let roleTimer = 0;
    if (!prefersReducedMotion()) {
      roleTimer = setInterval(rollToNextRole, ROLE_DWELL);
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(roleTimer);
      themeChannel?.close();
      themeChannel = null;
      stopRenderer(); // tear down canvas / RAF / resize listener on unmount
    };
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  Easter-egg renderer
  //
  //  10-A: ONE canvas, ONE requestAnimationFrame loop, and a list of active
  //  effects. Every effect (sonar waves, matrix rain, konami wave) draws onto
  //  the same surface each frame instead of spawning its own canvas + RAF.
  //  This also means HiDPI scaling (12) and resize handling (13) live in
  //  exactly one place.
  // ══════════════════════════════════════════════════════════════════════════

  // Cap the backing-store scale: full DPR on a 3× phone would ~9× the fill
  // cost, which fights the perf goals above. 2× is the sharpness/perf sweet spot.
  const DPR_CAP = 2;

  let fxCanvas        = null;
  let fxCtx           = null;
  let fxRaf           = 0;
  let fxResizePending = false;
  let fxPausedAt      = 0; // performance.now() when the tab was hidden; 0 = running
  let fxW             = 0;
  let fxH             = 0;
  const effects = []; // active effects: { startedAt, duration, render, onEnd?, onResize? }

  function fxResize() {
    if (!fxCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    fxW = window.innerWidth;
    fxH = window.innerHeight;
    fxCanvas.width        = Math.round(fxW * dpr);
    fxCanvas.height       = Math.round(fxH * dpr);
    fxCanvas.style.width  = fxW + 'px';
    fxCanvas.style.height = fxH + 'px';
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0); // 13: all drawing code works in CSS px
    for (const fx of effects) fx.onResize?.(fxW, fxH); // 13: let effects rebuild geometry
  }

  // 17: a resize burst (dragging a window edge) fires dozens of events; each
  // fxResize rebuilds the matrix/konami offscreen buffers and typed arrays.
  // Just flag it — fxTick applies the resize at the top of the next frame, so
  // the canvas-clearing resize and the redraw happen in the same frame and in
  // that order. Doing the resize in a *separate* rAF could land after the
  // frame's draw, leaving a blank canvas for one frame (visible flash).
  function scheduleResize() {
    fxResizePending = true;
    // Ensure a frame runs to apply it — but not while paused (hidden tab),
    // where onVisibility owns restarting the loop.
    if (!fxRaf && !fxPausedAt) fxRaf = requestAnimationFrame(fxTick);
  }

  // 9: effects measure progress as (now - startedAt) on the wall clock. While a
  // tab is hidden, rAF stops firing but the clock keeps running — so on return
  // an effect would jump ahead (or have silently expired). Pause by cancelling
  // the loop on hide, and on show shift every startedAt forward by the hidden
  // duration so accumulated elapsed is preserved and playback resumes in place.
  function onVisibility() {
    if (document.hidden) {
      if (fxRaf) { cancelAnimationFrame(fxRaf); fxRaf = 0; }
      fxPausedAt = performance.now();
    } else if (fxPausedAt) {
      const hiddenFor = performance.now() - fxPausedAt;
      fxPausedAt = 0;
      for (const fx of effects) fx.startedAt += hiddenFor;
      if (effects.length && !fxRaf) fxRaf = requestAnimationFrame(fxTick);
    }
  }

  function ensureCanvas() {
    if (fxCanvas) return;
    fxCanvas = document.createElement('canvas');
    fxCanvas.className = 'sonar-canvas';
    fxCtx = fxCanvas.getContext('2d');
    document.body.appendChild(fxCanvas);
    fxResize();
    window.addEventListener('resize', scheduleResize);
    document.addEventListener('visibilitychange', onVisibility);
  }

  function stopRenderer() {
    if (fxRaf) cancelAnimationFrame(fxRaf);
    fxRaf = 0;
    fxResizePending = false;
    fxPausedAt = 0;
    effects.length = 0;
    if (fxCanvas) {
      window.removeEventListener('resize', scheduleResize);
      document.removeEventListener('visibilitychange', onVisibility);
      fxCanvas.remove();
      fxCanvas = null;
      fxCtx = null;
    }
  }

  function addEffect(fx) {
    fx.startedAt = performance.now();
    effects.push(fx);
    if (!fxRaf) fxRaf = requestAnimationFrame(fxTick);
  }

  function fxTick(now) {
    fxRaf = 0;

    // Apply any pending resize first, in the same frame as the redraw below.
    // (Resizing the backing store clears it, so the draw must follow it here.)
    if (fxResizePending) {
      fxResizePending = false;
      fxResize();
    }

    fxCtx.clearRect(0, 0, fxW, fxH); // single clear for the whole frame

    // Draw oldest → newest so freshly triggered effects layer on top.
    for (let i = 0; i < effects.length; i++) {
      const fx = effects[i];
      // Clamp to 0: the rAF timestamp can be marginally earlier than the
      // performance.now() captured at trigger time, which would make the first
      // frame's elapsed — and any radius derived from it — slightly negative.
      const elapsed = Math.max(0, now - fx.startedAt);
      if (elapsed >= fx.duration) continue; // expired; reaped below
      fxCtx.save();
      try {
        fx.render(fxCtx, elapsed);
      } catch {
        fx.dead = true; // one effect's failure must never kill the shared loop
      }
      fxCtx.restore();
    }

    // Reap finished or failed effects (back-to-front so splices don't shift i).
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      if (fx.dead || now - fx.startedAt >= fx.duration) {
        fx.onEnd?.();
        effects.splice(i, 1);
      }
    }

    if (effects.length) fxRaf = requestAnimationFrame(fxTick);
    else stopRenderer();
  }

  // ── Variant selection ─────────────────────────────────────────────────────
  function pickVariant() {
    const r = Math.random() * 100;
    if (r < 0.5)  return 'rainbow';
    if (r < 1.5)  return 'mono';
    if (r < 2.0)  return 'matrix';
    if (r < 2.5)  return 'void';
    if (r < 3.0)  return 'glitch';
    if (r < 3.5)  return 'ripple';
    if (r < 4.0)  return 'gold';
    if (r < 4.5)  return 'ghost';
    if (r < 5.0)  return 'vercel';
    if (r < 5.5)  return 'clerk';
    return 'default';
  }

  const ALL_VARIANTS = ['default', 'rainbow', 'mono', 'matrix', 'void', 'glitch', 'ripple', 'gold', 'ghost', 'vercel', 'clerk'];

  function triggerAllWaves() {
    const rect = sparkEl.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    ALL_VARIANTS.forEach((v, i) => setTimeout(() => spawnWave(cx, cy, v, true), i * 1000));
  }

  function launchSonar(event) {
    if (prefersReducedMotion()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    spawnWave(rect.left + rect.width / 2, rect.top + rect.height / 2, null);
  }

  // ── Sonar waves ───────────────────────────────────────────────────────────
  const WAVE_DURATION = 5000;
  const MAX_SONARS    = 3;
  let   waveCount     = 0; // concurrent wave effects, for the MAX_SONARS cap

  // The nine "sources" are the real click point plus its reflections across the
  // four viewport edges and corners, so waves appear to bounce. Pure function of
  // (cx, cy, W, H) — recomputed on resize (13) so reflections stay aligned.
  function buildSources(cx, cy, W, H, SPEED) {
    const s = (dist) => dist / SPEED * 1000;
    return [
      { sx: cx,       sy: cy,       a: 1.00, bornAt: 0                            },
      { sx: -cx,      sy: cy,       a: 0.70, bornAt: s(cx)                        },
      { sx: 2*W-cx,   sy: cy,       a: 0.70, bornAt: s(W - cx)                    },
      { sx: cx,       sy: -cy,      a: 0.70, bornAt: s(cy)                        },
      { sx: cx,       sy: 2*H-cy,   a: 0.70, bornAt: s(H - cy)                    },
      { sx: -cx,      sy: -cy,      a: 0.40, bornAt: s(Math.hypot(cx, cy))        },
      { sx: 2*W-cx,   sy: -cy,      a: 0.40, bornAt: s(Math.hypot(W-cx, cy))      },
      { sx: -cx,      sy: 2*H-cy,   a: 0.40, bornAt: s(Math.hypot(cx, H-cy))      },
      { sx: 2*W-cx,   sy: 2*H-cy,   a: 0.40, bornAt: s(Math.hypot(W-cx, H-cy))    },
    ];
  }

  // 11: build one conic gradient per source ONCE. Colour flow is achieved by
  // rotating the context at fill time, so no gradients are allocated per frame
  // (was 9 gradients + 117 colour stops every frame).
  function buildRainbowGrads(ctx, sources) {
    return sources.map(({ sx, sy }) => {
      const g = ctx.createConicGradient(0, sx, sy);
      for (let j = 0; j <= 12; j++) g.addColorStop(j / 12, `hsl(${(j / 12) * 360},100%,58%)`);
      return g;
    });
  }

  function spawnWave(cx, cy, forcedVariant, bypassLimit = false) {
    if (prefersReducedMotion()) return;
    if (!bypassLimit && waveCount >= MAX_SONARS) return;
    ensureCanvas();

    const variant = forcedVariant ?? pickVariant();
    const SPEED   = variant === 'matrix' ? 440
                  : variant === 'vercel' ? 260
                  : 220;

    if (variant === 'matrix') addMatrixEffect();

    const highlightEl = variant === 'vercel' ? document.querySelector('.tl-vercel')
                      : variant === 'clerk'  ? document.querySelector('.tl-clerk')
                      : null;
    if (highlightEl) highlightEl.classList.add('tl-company--lit');

    // Brand waves emanate from the company's logo on the timeline rather than the
    // "now" spark, so the ripple visibly originates at the Vercel ▲ / Clerk ◐ mark.
    const brandSvg = highlightEl?.querySelector('svg');
    if (brandSvg) {
      const r = brandSvg.getBoundingClientRect();
      cx = r.left + r.width  / 2;
      cy = r.top  + r.height / 2;
    }

    let sources      = buildSources(cx, cy, fxW, fxH, SPEED);
    let rainbowGrads = variant === 'rainbow' ? buildRainbowGrads(fxCtx, sources) : null;

    waveCount++;

    addEffect({
      duration: WAVE_DURATION,
      onResize(W, H) {
        sources = buildSources(cx, cy, W, H, SPEED);
        if (variant === 'rainbow') rainbowGrads = buildRainbowGrads(fxCtx, sources);
      },
      onEnd() {
        waveCount--;
        if (highlightEl) highlightEl.classList.remove('tl-company--lit');
      },
      render(ctx, elapsed) {
        drawWave(ctx, elapsed, variant, SPEED, sources, rainbowGrads);
      },
    });
  }

  function drawWave(ctx, elapsed, variant, SPEED, sources, rainbowGrads) {
    const W = fxW, H = fxH;
    const r = elapsed / 1000 * SPEED;

    if (variant === 'void') {
      // Dark overlay covers the page; destination-out punches transparent ring
      // annuli through it, revealing the page in a growing circular window.
      const globalAlpha = Math.max(0, 1 - elapsed / WAVE_DURATION);
      const ringW = 40;

      ctx.fillStyle = `rgba(0,0,0,${(0.82 * globalAlpha).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      for (const { sx, sy, bornAt } of sources) {
        if (elapsed < bornAt) continue;
        const rw = bornAt === 0 ? ringW : ringW * 0.7;
        ctx.beginPath();
        ctx.arc(sx, sy, r + rw / 2, 0, Math.PI * 2, false);
        ctx.arc(sx, sy, Math.max(0, r - rw / 2), 0, Math.PI * 2, true);
        ctx.fill('evenodd');
      }
      return;
    }

    for (let si = 0; si < sources.length; si++) {
      const { sx, sy, a, bornAt } = sources[si];
      if (elapsed < bornAt) continue;
      const remaining = WAVE_DURATION - bornAt;
      const alpha = a * Math.max(0, 1 - (elapsed - bornAt) / remaining);
      if (alpha < 0.01) continue;

      if (variant === 'rainbow') {
        // Rotate the context about the source so the (statically built) conic
        // gradient appears to flow. One full revolution per 4 s.
        const angle = elapsed * Math.PI / 2000;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.translate(-sx, -sy);
        ctx.fillStyle = rainbowGrads[si];

        ctx.globalAlpha = alpha * 0.28; // glow pass — wider ring, faint
        ctx.beginPath();
        ctx.arc(sx, sy, r + 12, 0, Math.PI * 2, false);
        ctx.arc(sx, sy, Math.max(1, r - 12), 0, Math.PI * 2, true);
        ctx.fill('evenodd');

        ctx.globalAlpha = alpha; // main ring
        ctx.beginPath();
        ctx.arc(sx, sy, r + 3, 0, Math.PI * 2, false);
        ctx.arc(sx, sy, Math.max(1, r - 3), 0, Math.PI * 2, true);
        ctx.fill('evenodd');

        ctx.restore();
        continue;
      }

      if (variant === 'glitch') {
        // Chromatic aberration: red and cyan channels drift apart each 180ms
        const phase = Math.floor(elapsed / 180);
        const dx = Math.sin(phase * 2.7) * 7;
        const dy = Math.cos(phase * 1.9) * 5;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sx - dx, sy - dy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,60,60,${(alpha * 0.85).toFixed(3)})`; ctx.stroke();
        ctx.beginPath(); ctx.arc(sx + dx, sy + dy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(60,255,220,${(alpha * 0.85).toFixed(3)})`; ctx.stroke();
        continue;
      }

      if (variant === 'ripple') {
        // Three concentric rings spaced 28px apart, trailing off in opacity
        ctx.lineWidth = 1;
        for (const [offset, fade] of [[0, 1.0], [-28, 0.55], [-56, 0.25]]) {
          const rr = r + offset;
          if (rr < 1) continue;
          ctx.beginPath(); ctx.arc(sx, sy, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,102,0,${(alpha * fade).toFixed(3)})`; ctx.stroke();
        }
        continue;
      }

      if (variant === 'vercel') {
        if (bornAt !== 0) continue;  // no reflections — single expanding triangle
        // Expanding equilateral triangle — matches Vercel's ▲ logo orientation.
        // r is the circumradius (center → vertex), same scale as the circle waves.
        const h = r * Math.sqrt(3) / 2;  // half-width at base
        // White ▲ on dark, black ▲ on light. Read the theme live so a mid-wave
        // toggle recolours correctly (same approach as the mono variant).
        const rgb = document.documentElement.classList.contains('theme-dark') ? '255,255,255' : '0,0,0';
        ctx.beginPath();
        ctx.moveTo(sx,     sy - r);       // top vertex
        ctx.lineTo(sx + h, sy + r / 2);   // bottom-right
        ctx.lineTo(sx - h, sy + r / 2);   // bottom-left
        ctx.closePath();
        ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.lineWidth   = 2;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = `rgba(${rgb},${(alpha * 0.6).toFixed(3)})`;
        ctx.stroke();
        ctx.shadowBlur  = 0;
        ctx.shadowColor = 'transparent';
        continue;
      }

      if (variant === 'clerk') {
        if (bornAt !== 0) continue;  // single expanding circle, no reflections
        // Clerk's mark is monochrome (black/grey/white), so the wave borrows the
        // vercel colours: white ring on dark, black on light. Read the theme live
        // so a mid-wave toggle recolours correctly (same approach as vercel/mono).
        const rgb = document.documentElement.classList.contains('theme-dark') ? '255,255,255' : '0,0,0';
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.lineWidth   = 2;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = `rgba(${rgb},${(alpha * 0.6).toFixed(3)})`;
        ctx.stroke();
        ctx.shadowBlur  = 0;
        ctx.shadowColor = 'transparent';
        continue;
      }

      if (variant === 'ghost') {
        // Three-pass layered glow: wide bloom → mid halo → bright core.
        // 11: blur radii capped (was 48/22/8) — large shadowBlur is the most
        // expensive canvas op and dominated this variant's per-frame cost.
        const layers = [
          { blur: 24, width: 12, color: `rgba(160,60,255,${(alpha * 0.18).toFixed(3)})` },
          { blur: 16, width: 5,  color: `rgba(190,100,255,${(alpha * 0.45).toFixed(3)})` },
          { blur: 8,  width: 2,  color: `rgba(230,180,255,${(alpha * 0.9).toFixed(3)})` },
        ];
        for (const layer of layers) {
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.lineWidth   = layer.width;
          ctx.strokeStyle = layer.color;
          ctx.shadowBlur  = layer.blur;
          ctx.shadowColor = `rgba(150,50,255,${(alpha * 0.7).toFixed(3)})`;
          ctx.stroke();
        }
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        continue;
      }

      let color, lineWidth;
      if (variant === 'mono') {
        // Read the theme live so a mid-wave toggle recolours correctly (#18).
        const rgb = document.documentElement.classList.contains('theme-dark') ? '255,255,255' : '0,0,0';
        color     = `rgba(${rgb},${alpha.toFixed(3)})`;
        lineWidth = 1;
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      } else if (variant === 'matrix') {
        color     = `rgba(0,255,65,${alpha.toFixed(3)})`;
        lineWidth = 2;
        ctx.shadowBlur = 18; ctx.shadowColor = `rgba(0,255,65,${(alpha * 0.9).toFixed(3)})`;
      } else if (variant === 'gold') {
        color     = `rgba(255,210,0,${alpha.toFixed(3)})`;
        lineWidth = 2;
        ctx.shadowBlur = 14; ctx.shadowColor = `rgba(255,210,0,${(alpha * 0.7).toFixed(3)})`;
      } else {
        color     = `rgba(255,102,0,${alpha.toFixed(3)})`; // default
        lineWidth = 1;
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
      }

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = lineWidth;
      ctx.stroke();
    }

    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  }

  // ── Matrix rain ───────────────────────────────────────────────────────────
  // Full-page falling-character overlay triggered alongside the matrix wave.
  // The trail effect needs frame-to-frame persistence, which the shared (cleared
  // every frame) canvas can't provide — so it accumulates on its own offscreen
  // buffer and is composited onto the shared canvas each frame. Singleton.
  const MATRIX_DURATION = 8000;
  let matrixFx = null;

  function addMatrixEffect() {
    if (prefersReducedMotion()) return;
    ensureCanvas();
    if (matrixFx) { // restart rather than stack a second instance
      const idx = effects.indexOf(matrixFx);
      if (idx >= 0) effects.splice(idx, 1);
      matrixFx = null;
    }

    const CHARS     = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
    const FONT_SIZE = 14;

    let buf, bctx, cols, drops, headChar, bodyChar;
    function build(W, H) {
      buf = document.createElement('canvas');
      buf.width = W; buf.height = H;
      bctx = buf.getContext('2d');
      cols     = Math.floor(W / FONT_SIZE);
      drops    = Array.from({ length: cols }, () => Math.random() * -H / FONT_SIZE | 0);
      headChar = Array.from({ length: cols }, () => CHARS[Math.random() * CHARS.length | 0]);
      bodyChar = Array.from({ length: cols }, () => CHARS[Math.random() * CHARS.length | 0]);
    }
    build(fxW, fxH);
    let frame = 0;

    matrixFx = {
      duration: MATRIX_DURATION,
      onResize(W, H) { build(W, H); },
      onEnd() { matrixFx = null; },
      render(ctx, elapsed) {
        const W = fxW, H = fxH;
        const fadeOut = elapsed > 5000 ? 1 - (elapsed - 5000) / 3000 : 1;

        // Accumulate on the offscreen buffer (semi-transparent black = trail).
        bctx.fillStyle = 'rgba(0,0,0,0.05)';
        bctx.fillRect(0, 0, W, H);
        bctx.font = `${FONT_SIZE}px monospace`;

        const advance = (frame % 6 === 0);
        frame++;

        for (let i = 0; i < drops.length; i++) {
          const x = i * FONT_SIZE;
          const y = drops[i] * FONT_SIZE;
          if (advance) {
            headChar[i] = CHARS[Math.random() * CHARS.length | 0];
            bodyChar[i] = CHARS[Math.random() * CHARS.length | 0];
          }
          bctx.fillStyle = 'rgba(180,255,180,0.95)';
          bctx.fillText(headChar[i], x, y);
          bctx.fillStyle = 'rgba(0,255,65,0.55)';
          bctx.fillText(bodyChar[i], x, y - FONT_SIZE);
          if (advance) {
            if (y > H && Math.random() > 0.975) drops[i] = 0;
            else drops[i]++;
          }
        }

        ctx.globalAlpha = Math.max(0, fadeOut);
        ctx.drawImage(buf, 0, 0, W, H);
      },
    };
    addEffect(matrixFx);
  }

  // ── Konami wave ───────────────────────────────────────────────────────────
  const KONAMI_DURATION = 7000;
  let konamiFx = null;

  function spawnKonamiWave() {
    if (prefersReducedMotion()) return;
    ensureCanvas();
    if (konamiFx) { // restart rather than stack
      const idx = effects.indexOf(konamiFx);
      if (idx >= 0) effects.splice(idx, 1);
      konamiFx = null;
    }

    const BLOCK      = 8;
    const NES_COLORS = ['#FF0000','#FF7700','#FFFF00','#00CC00','#00CCFF','#0000FF','#CC00FF','#FF00CC','#FFFFFF'];

    const sr = sparkEl.getBoundingClientRect();
    const cx = sr.left + sr.width  / 2;
    const cy = sr.top  + sr.height / 2;

    // 11: scanlines as a single tiled fill (2px bar / 2px gap) instead of
    // ~H/4 fillRect calls per frame.
    const scan = document.createElement('canvas');
    scan.width = 1; scan.height = 4;
    const sctx = scan.getContext('2d');
    sctx.fillStyle = 'rgba(0,0,0,0.18)';
    sctx.fillRect(0, 0, 1, 2);
    const scanPattern = fxCtx.createPattern(scan, 'repeat');

    // 11: reused typed-array grid for block dedup, replacing a per-frame Set of
    // string keys (which churned the GC as the ring radius grew).
    let cols, rows, visited;
    function build(W, H) {
      cols    = Math.ceil(W / BLOCK) + 3;
      rows    = Math.ceil(H / BLOCK) + 3;
      visited = new Uint8Array(cols * rows);
    }
    build(fxW, fxH);

    let colorIdx = 0, frame = 0;

    konamiFx = {
      duration: KONAMI_DURATION,
      onResize(W, H) { build(W, H); },
      onEnd() { konamiFx = null; },
      render(ctx, elapsed) {
        const W = fxW, H = fxH;
        const elemFade = elapsed > 4500 ? 1 - (elapsed - 4500) / 2500 : 1;
        ctx.globalAlpha = Math.max(0, elemFade);

        ctx.fillStyle = scanPattern;
        ctx.fillRect(0, 0, W, H);

        if (frame % 10 === 0) colorIdx = (colorIdx + 1) % NES_COLORS.length;
        frame++;

        const r = elapsed / 1000 * 220;
        ctx.fillStyle = NES_COLORS[colorIdx];
        visited.fill(0);

        const steps = Math.max(48, Math.ceil(2 * Math.PI * r / BLOCK) * 2);
        for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          for (let w = 0; w < 3; w++) {
            const pr = r - w * BLOCK;
            if (pr < 1) continue;
            const bx = Math.round((cx + Math.cos(angle) * pr) / BLOCK) * BLOCK;
            const by = Math.round((cy + Math.sin(angle) * pr) / BLOCK) * BLOCK;
            const gx = (bx / BLOCK) + 1; // +1 so the -1 fringe maps to index 0
            const gy = (by / BLOCK) + 1;
            if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) {
              ctx.fillRect(bx, by, BLOCK, BLOCK); // off-grid: draw without dedup
              continue;
            }
            const idx = gy * cols + gx;
            if (visited[idx]) continue;
            visited[idx] = 1;
            ctx.fillRect(bx, by, BLOCK, BLOCK);
          }
        }

        if (elapsed < 2200) {
          const floatY   = cy - 20 - (elapsed / 2200) * 70;
          const textFade = elapsed < 1600 ? 1 : 1 - (elapsed - 1600) / 600;
          ctx.globalAlpha = Math.max(0, elemFade * textFade);
          ctx.fillStyle   = '#FFFF00';
          ctx.font        = 'bold 22px monospace';
          ctx.textAlign   = 'center';
          ctx.shadowBlur  = 10;
          ctx.shadowColor = '#FF8800';
          ctx.fillText('1UP', cx, floatY);
          ctx.shadowBlur  = 0;
          ctx.textAlign   = 'left';
        }
      },
    };
    addEffect(konamiFx);
  }

  // ── Timeline math ────────────────────────────────────────────
  // Right edge is fixed at Jan 2018. Left edge is "now", clamped
  // to a minimum of May 24 2026 to guard against tampered clocks.
  const tlStart  = new Date(2018, 0, 1);   // Jan 2018 — right edge
  const tlMinNow = new Date(2026, 4, 24);  // May 24, 2026 — floor
  const tlNow    = new Date() < tlMinNow ? tlMinNow : new Date();

  const tlTotalMonths =
    (tlNow.getFullYear() - tlStart.getFullYear()) * 12 +
    (tlNow.getMonth()    - tlStart.getMonth());

  // Percentage from the left (now) for any date on the timeline
  function tlPct(date) {
    const months =
      (tlNow.getFullYear() - date.getFullYear()) * 12 +
      (tlNow.getMonth()    - date.getMonth());
    return +(Math.max(0, Math.min(100, months / tlTotalMonths * 100)).toFixed(3));
  }

  // Vercel: Nov 2018 → Feb 2026
  const vercelEndDate   = new Date(2026,  1, 1);  // Feb 2026
  const vercelStartDate = new Date(2018, 10, 1);  // Nov 2018
  const vercelLeft      = tlPct(vercelEndDate);
  const vercelWidth     = tlPct(vercelStartDate) - vercelLeft;
  const vercelLabelLeft = vercelLeft + vercelWidth / 2;

  // Year markers (positions only — '18 is always the right edge)
  const tlYears = [2024, 2022, 2020].map(y => ({
    label: `'${String(y).slice(2)}`,
    left:  tlPct(new Date(y, 0, 1)),
  }));

  // schema.org Person — lets search engines render paulogdm as an entity and
  // ties the social links together via sameAs. Emitted as a raw <script> in
  // <svelte:head> through {@html} (a literal <script> tag there is captured by
  // the compiler as a component script instead of being rendered as markup).
  const personJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Paulo G. De Mitri',
    alternateName: 'paulogdm',
    url: 'https://paulogdm.com',
    image: 'https://paulogdm.com/assets/me.jpg',
    jobTitle: 'Sr. Technical Account Manager',
    worksFor: { '@type': 'Organization', name: 'Clerk', url: 'https://clerk.com' },
    email: 'mailto:me@paulogdm.com',
    sameAs: [
      'https://x.com/paulogdm',
      'https://www.linkedin.com/in/paulogdm/',
      'https://github.com/paulogdm',
      'https://stackoverflow.com/users/2665655/paulogdm',
    ],
  });

</script>

<svelte:head>
  <title>paulogdm</title>
  <meta property="og:title" content="paulogdm" />
  <meta property="og:description" content="Paulogdm personal page. Make yourself at home." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://paulogdm.com" />
  <meta property="og:image" content="https://paulogdm.com/assets/ogimage.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@paulogdm" />
  {@html `<script type="application/ld+json">${personJsonLd}</script>`}
</svelte:head>

<div class="container">
  <div class="px-4 py-4">
    <button
      onclick={changeBackground}
      class="lightbulb animated fadeIn p-2 {lights ? 'mode-dark' : 'mode-light'}"
      aria-label="Toggle light/dark mode"
    >
      {#key lights}
        <span class="icon-swap">
          <Icon icon={lights ? sunIcon : moonIcon} width="2em" />
        </span>
      {/key}
    </button>
  </div>

  <div class="my-4 text-center">
    <div class="me-size animated fadeIn" class:me-size--dragging={isDragging} style="animation-delay: 0.1s">
      <img
        src="/assets/me.jpg"
        class="mx-auto d-block me-photo"
        alt="paulogdm"
        width="500"
        height="500"
        draggable="false"
        fetchpriority="high"
        style={photoStyle}
        onpointerdown={onPhotoDragStart}
        onpointermove={onPhotoMove}
        onpointerup={onPhotoRelease}
        onpointercancel={onPhotoRelease}
      >
    </div>

    <div class="my-5 py-2 animated fadeIn" style="animation-delay: 0.25s">
      <h1>paulogdm</h1>

      <p class="role-ticker">
        <span class="sr-only">{ALL_ROLES.join(', ')}</span>
        <span class="role-ticker__slot" aria-hidden="true">
          <span class="role-ticker__sizer">
            {#each ALL_ROLES as r}<span>{r}</span>{/each}
          </span>
          {#key role}
            <span class="role-ticker__role" in:fade={{ duration: FADE_IN, delay: FADE_OUT }} out:fade={{ duration: FADE_OUT }}>{role}</span>
          {/key}
        </span>
      </p>

      <nav class="social-links" aria-label="Social media and contact links">
        <a class="mx-2" href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;&#109;&#101;&#64;&#112;&#97;&#117;&#108;&#111;&#103;&#100;&#109;&#46;&#99;&#111;&#109;" aria-label="Email">
          <Icon icon={mailIcon} width="1.33em" />
        </a>
        <a class="mx-2" href="https://x.com/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="X">
          <Icon icon={xIcon} width="1.33em" />
        </a>
        <a class="mx-2" href="https://www.linkedin.com/in/paulogdm/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <Icon icon={linkedinIcon} width="1.33em" />
        </a>
        <a class="mx-2" href="https://github.com/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <Icon icon={githubIcon} width="1.33em" />
        </a>
        <a class="mx-2" href="https://stackoverflow.com/users/2665655/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="Stack Overflow">
          <Icon icon={stackoverflowIcon} width="1.33em" />
        </a>
        <a class="mx-2" href="https://cal.com/paulogdm/15min" target="_blank" rel="noopener noreferrer" aria-label="Schedule a time using cal.com">
          <Icon icon={calendarIcon} width="1.33em" />
        </a>
      </nav>
    </div>
  </div>

  <section
    class="tl-section animated fadeIn"
    style="animation-delay: 0.45s"
    aria-label="Career timeline: Vercel, November 2018 to February 2026. Clerk, June 2026 to now."
  >
    <div class="tl-wrap">
      <div class="tl-labels" aria-hidden="true">
        <div class="tl-company tl-clerk" data-tenure="now ← Jun '26">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="m21.47 20.829-2.881-2.881a.572.572 0 0 0-.7-.084 6.854 6.854 0 0 1-7.081 0 .576.576 0 0 0-.7.084l-2.881 2.881a.576.576 0 0 0-.103.69.57.57 0 0 0 .166.186 12 12 0 0 0 14.113 0 .58.58 0 0 0 .239-.423.576.576 0 0 0-.172-.453Zm.002-17.668-2.88 2.88a.569.569 0 0 1-.701.084A6.857 6.857 0 0 0 8.724 8.08a6.862 6.862 0 0 0-1.222 3.692 6.86 6.86 0 0 0 .978 3.764.573.573 0 0 1-.083.699l-2.881 2.88a.567.567 0 0 1-.864-.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637-.405.566.566 0 0 1 .232.418.57.57 0 0 1-.168.448Zm-7.118 12.261a3.427 3.427 0 1 0 0-6.854 3.427 3.427 0 0 0 0 6.854Z"/>
          </svg>
          Clerk
        </div>
        <div class="tl-company tl-vercel" data-tenure="Feb '26 ← Nov '18" style="left: {vercelLabelLeft}%">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="m12 1.608 12 20.784H0Z"/>
          </svg>
          Vercel
        </div>
      </div>
      <div class="tl-track" aria-hidden="true">
        <span class="tl-spark" onclick={launchSonar}></span>
        <span class="tl-vercel-seg" style="left: {vercelLeft}%; width: {vercelWidth}%"></span>
      </div>
      <div class="tl-years" aria-hidden="true">
        <span class="tl-yr tl-yr-now">now</span>
        {#each tlYears as { label, left }}
          <span class="tl-yr" style="left: {left}%">{label}</span>
        {/each}
        <span class="tl-yr tl-yr-end">'18</span>
      </div>
    </div>
  </section>
</div>
