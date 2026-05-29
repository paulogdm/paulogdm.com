<script>
  import { onMount } from 'svelte';
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

  function changeBackground() {
    lights = !lights;
    document.documentElement.classList.toggle('theme-dark', lights);
    document.documentElement.classList.toggle('theme-light', !lights);
    // SameSite=Lax: this is a first-party preference cookie, never sent cross-site.
    document.cookie = `lights=${lights ? 'on' : 'off'}; path=/; max-age=31536000; SameSite=Lax`;
  }

  onMount(() => {
    sparkEl = document.querySelector('.tl-spark');

    // The blocking script in app.html already resolved the theme (cookie →
    // system preference) and applied the class before first paint. Sync our
    // reactive state from that single source of truth rather than re-deriving it.
    lights = document.documentElement.classList.contains('theme-dark');

    let keyBuf = '';
    const KONAMI_SEQ = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
    let konamiIdx = 0;

    function onKey(e) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

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
    return () => window.removeEventListener('keydown', onKey);
  });

  let activeSonars = 0;
  const MAX_SONARS = 3;

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
    const cx    = rect.left + rect.width / 2;
    const cy    = rect.top  + rect.height / 2;
    ALL_VARIANTS.forEach((v, i) => setTimeout(() => spawnWave(cx, cy, v, true), i * 1000));
  }

  function launchSonar(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    spawnWave(rect.left + rect.width / 2, rect.top + rect.height / 2, null);
  }

  // ── MATRIX RAIN ─────────────────────────────────────────────────────────────
  // Full-page falling-character overlay triggered alongside the matrix wave.
  // Remove the spawnMatrixRain() call in spawnWave and this entire block to
  // disable the effect without touching anything else.
  function spawnMatrixRain() {
    const DURATION  = 8000;
    const CHARS     = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
    const FONT_SIZE = 14;

    const canvas  = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9998;';
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const cols     = Math.floor(W / FONT_SIZE);
    const drops    = Array.from({ length: cols }, () => Math.random() * -H / FONT_SIZE | 0);
    const headChar = Array.from({ length: cols }, () => CHARS[Math.random() * CHARS.length | 0]);
    const bodyChar = Array.from({ length: cols }, () => CHARS[Math.random() * CHARS.length | 0]);
    const start    = performance.now();
    let frame      = 0;

    function tick(now) {
      const elapsed  = now - start;
      if (elapsed >= DURATION) { canvas.remove(); return; }

      const fadeOut = elapsed > 5000 ? 1 - (elapsed - 5000) / 3000 : 1;

      canvas.style.opacity = fadeOut;

      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${FONT_SIZE}px monospace`;

      const advance = (frame % 6 === 0);
      frame++;

      for (let i = 0; i < drops.length; i++) {
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        if (advance) {
          headChar[i] = CHARS[Math.random() * CHARS.length | 0];
          bodyChar[i] = CHARS[Math.random() * CHARS.length | 0];
        }

        ctx.fillStyle = `rgba(180,255,180,${0.95 * fadeOut})`;
        ctx.fillText(headChar[i], x, y);

        ctx.fillStyle = `rgba(0,255,65,${0.55 * fadeOut})`;
        ctx.fillText(bodyChar[i], x, y - FONT_SIZE);

        if (advance) {
          if (y > H && Math.random() > 0.975) drops[i] = 0;
          else drops[i]++;
        }
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  // ── END MATRIX RAIN ──────────────────────────────────────────────────────────

  // ── KONAMI WAVE ──────────────────────────────────────────────────────────────
  function spawnKonamiWave() {
    const DURATION   = 7000;
    const BLOCK      = 8;
    const NES_COLORS = ['#FF0000','#FF7700','#FFFF00','#00CC00','#00CCFF','#0000FF','#CC00FF','#FF00CC','#FFFFFF'];

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const sr = sparkEl.getBoundingClientRect();
    const cx = sr.left + sr.width  / 2;
    const cy    = sr.top  + sr.height / 2;

    const start = performance.now();
    let colorIdx = 0;
    let frame    = 0;

    function tick(now) {
      const elapsed = now - start;
      if (elapsed >= DURATION) { canvas.remove(); return; }

      // Fade the whole canvas element after 4.5s, same pattern as matrix rain
      canvas.style.opacity = elapsed > 4500 ? 1 - (elapsed - 4500) / 2500 : 1;

      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

      if (frame % 10 === 0) colorIdx = (colorIdx + 1) % NES_COLORS.length;
      frame++;

      const r     = elapsed / 1000 * 220;
      const color = NES_COLORS[colorIdx];

      const steps = Math.max(48, Math.ceil(2 * Math.PI * r / BLOCK) * 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle   = color;
      const drawn = new Set();
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        for (let w = 0; w < 3; w++) {
          const pr = r - w * BLOCK;
          if (pr < 1) continue;
          const bx = Math.round((cx + Math.cos(angle) * pr) / BLOCK) * BLOCK;
          const by = Math.round((cy + Math.sin(angle) * pr) / BLOCK) * BLOCK;
          const key = `${bx},${by}`;
          if (drawn.has(key)) continue;
          drawn.add(key);
          ctx.fillRect(bx, by, BLOCK, BLOCK);
        }
      }

      if (elapsed < 2200) {
        const floatY   = cy - 20 - (elapsed / 2200) * 70;
        const textFade = elapsed < 1600 ? 1 : 1 - (elapsed - 1600) / 600;
        ctx.globalAlpha  = textFade;
        ctx.fillStyle    = '#FFFF00';
        ctx.font         = 'bold 22px monospace';
        ctx.textAlign    = 'center';
        ctx.shadowBlur   = 10;
        ctx.shadowColor  = '#FF8800';
        ctx.fillText('1UP', cx, floatY);
        ctx.shadowBlur   = 0;
        ctx.textAlign    = 'left';
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  // ── END KONAMI WAVE ───────────────────────────────────────────────────────────

  function spawnWave(cx, cy, forcedVariant, bypassLimit = false) {
    if (!bypassLimit && activeSonars >= MAX_SONARS) return;
    activeSonars++;

    const canvas = document.createElement('canvas');
    canvas.className = 'sonar-canvas';
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const variant  = forcedVariant ?? pickVariant();
    if (variant === 'matrix') spawnMatrixRain();
    const DURATION = 5000;
    const SPEED    = variant === 'matrix' ? 440
                   : variant === 'vercel' ? 260
                   : 220;
    const isDark   = document.documentElement.classList.contains('theme-dark');

    const highlightEl = variant === 'vercel' ? document.querySelector('.tl-vercel')
                      : variant === 'clerk'  ? document.querySelector('.tl-clerk')
                      : null;
    if (highlightEl) highlightEl.classList.add('tl-company--lit');

    const s = (dist) => dist / SPEED * 1000;
    const sources = [
      { sx: cx,       sy: cy,       a: 1.00, bornAt: 0                              },
      { sx: -cx,      sy: cy,       a: 0.70, bornAt: s(cx)                          },
      { sx: 2*W-cx,   sy: cy,       a: 0.70, bornAt: s(W - cx)                      },
      { sx: cx,       sy: -cy,      a: 0.70, bornAt: s(cy)                          },
      { sx: cx,       sy: 2*H-cy,   a: 0.70, bornAt: s(H - cy)                      },
      { sx: -cx,      sy: -cy,      a: 0.40, bornAt: s(Math.hypot(cx, cy))          },
      { sx: 2*W-cx,   sy: -cy,      a: 0.40, bornAt: s(Math.hypot(W-cx, cy))       },
      { sx: -cx,      sy: 2*H-cy,   a: 0.40, bornAt: s(Math.hypot(cx, H-cy))       },
      { sx: 2*W-cx,   sy: 2*H-cy,   a: 0.40, bornAt: s(Math.hypot(W-cx, H-cy))    },
    ];

    // Rainbow gradients are rebuilt each frame with a rotating startAngle so
    // colours appear to flow anti-clockwise. One full revolution per 4 s.
    // The per-frame cost (9 allocations) is acceptable for this rare variant.
    const rainbowGrads = variant === 'rainbow' ? [] : null;

    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;

      if (elapsed >= DURATION) {
        canvas.remove();
        activeSonars--;
        if (highlightEl) highlightEl.classList.remove('tl-company--lit');
        return;
      }

      if (rainbowGrads) {
        const angle = elapsed * Math.PI / 2000; // 2π per 4000 ms, CW rotation → CCW colour flow
        for (let i = 0; i < sources.length; i++) {
          const { sx, sy } = sources[i];
          const g = ctx.createConicGradient(angle, sx, sy);
          for (let j = 0; j <= 12; j++) g.addColorStop(j / 12, `hsl(${(j / 12) * 360},100%,58%)`);
          rainbowGrads[i] = g;
        }
      }

      const r = elapsed / 1000 * SPEED;
      ctx.clearRect(0, 0, W, H);

      if (variant === 'void') {
        // Dark overlay covers the page; destination-out punches transparent ring
        // annuli through it, revealing the page in a growing circular window.
        const globalAlpha = Math.max(0, 1 - elapsed / DURATION);
        const ringW = 40;

        ctx.globalCompositeOperation = 'source-over';
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
        ctx.globalCompositeOperation = 'source-over';
      } else {
        for (let si = 0; si < sources.length; si++) {
          const { sx, sy, a, bornAt } = sources[si];
          if (elapsed < bornAt) continue;
          const remaining = DURATION - bornAt;
          const alpha = a * Math.max(0, 1 - (elapsed - bornAt) / remaining);
          if (alpha < 0.01) continue;

          if (variant === 'rainbow') {
            ctx.fillStyle = rainbowGrads[si];

            // Glow pass — wider ring, faint
            ctx.globalAlpha = alpha * 0.28;
            ctx.beginPath();
            ctx.arc(sx, sy, r + 12, 0, Math.PI * 2, false);
            ctx.arc(sx, sy, Math.max(1, r - 12), 0, Math.PI * 2, true);
            ctx.fill('evenodd');

            // Main ring
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sx, sy, r + 3, 0, Math.PI * 2, false);
            ctx.arc(sx, sy, Math.max(1, r - 3), 0, Math.PI * 2, true);
            ctx.fill('evenodd');

            ctx.globalAlpha = 1;
            continue;
          }

          if (variant === 'glitch') {
            // Chromatic aberration: red and cyan channels drift apart each 180ms
            const phase = Math.floor(elapsed / 180);
            const dx = Math.sin(phase * 2.7) * 7;
            const dy = Math.cos(phase * 1.9) * 5;
            ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
            ctx.beginPath(); ctx.arc(sx - dx, sy - dy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,60,60,${(alpha * 0.85).toFixed(3)})`; ctx.stroke();
            ctx.beginPath(); ctx.arc(sx + dx, sy + dy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(60,255,220,${(alpha * 0.85).toFixed(3)})`; ctx.stroke();
            continue;
          }

          if (variant === 'ripple') {
            // Three concentric rings spaced 28px apart, trailing off in opacity
            ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
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
            ctx.beginPath();
            ctx.moveTo(sx,         sy - r);          // top vertex
            ctx.lineTo(sx + h,     sy + r / 2);      // bottom-right
            ctx.lineTo(sx - h,     sy + r / 2);      // bottom-left
            ctx.closePath();
            ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
            ctx.lineWidth   = 2;
            ctx.shadowBlur  = 20;
            ctx.shadowColor = `rgba(255,255,255,${(alpha * 0.6).toFixed(3)})`;
            ctx.stroke();
            ctx.shadowBlur  = 0;
            ctx.shadowColor = 'transparent';
            continue;
          }

          let color, lineWidth;

          if (variant === 'mono') {
            const rgb = isDark ? '255,255,255' : '0,0,0';
            color     = `rgba(${rgb},${alpha.toFixed(3)})`;
            lineWidth = 1;
            ctx.shadowBlur  = 0;
            ctx.shadowColor = 'transparent';
          } else if (variant === 'matrix') {
            color          = `rgba(0,255,65,${alpha.toFixed(3)})`;
            lineWidth      = 2;
            ctx.shadowBlur  = 18;
            ctx.shadowColor = `rgba(0,255,65,${(alpha * 0.9).toFixed(3)})`;
          } else if (variant === 'gold') {
            color          = `rgba(255,210,0,${alpha.toFixed(3)})`;
            lineWidth      = 2;
            ctx.shadowBlur  = 14;
            ctx.shadowColor = `rgba(255,210,0,${(alpha * 0.7).toFixed(3)})`;
          } else if (variant === 'ghost') {
            // Three-pass layered glow: wide bloom → mid halo → bright core
            const layers = [
              { blur: 48, width: 12, color: `rgba(160,60,255,${(alpha * 0.18).toFixed(3)})` },
              { blur: 22, width: 5,  color: `rgba(190,100,255,${(alpha * 0.45).toFixed(3)})` },
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
          } else if (variant === 'clerk') {
            color          = `rgba(108,71,255,${alpha.toFixed(3)})`;
            lineWidth      = 2;
            ctx.shadowBlur  = 14;
            ctx.shadowColor = `rgba(108,71,255,${(alpha * 0.7).toFixed(3)})`;
          } else {
            // default
            color     = `rgba(255,102,0,${alpha.toFixed(3)})`;
            lineWidth = 1;
            ctx.shadowBlur  = 0;
            ctx.shadowColor = 'transparent';
          }

          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth   = lineWidth;
          ctx.stroke();
        }

        ctx.shadowBlur  = 0;
        ctx.shadowColor = 'transparent';
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
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
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@paulogdm" />
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
        draggable="false"
        style={photoStyle}
        onpointerdown={onPhotoDragStart}
        onpointermove={onPhotoMove}
        onpointerup={onPhotoRelease}
        onpointercancel={onPhotoRelease}
      >
    </div>

    <div class="my-5 py-2 animated fadeIn" style="animation-delay: 0.25s">
      <h1>paulogdm</h1>
      <nav class="social-links mt-3" aria-label="Social media and contact links">
        <a class="mx-2" href="&#77;&#97;&#73;&#76;&#84;&#79;&#58;&#109;&#101;&#64;&#112;&#97;&#117;&#108;&#111;&#103;&#100;&#109;&#46;&#99;&#111;&#109;" target="_blank" rel="noopener noreferrer" aria-label="Email">
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
