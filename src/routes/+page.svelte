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

  let lights = $state(false);

  $effect(() => {
    document.documentElement.classList.toggle('theme-dark', lights);
    document.documentElement.classList.toggle('theme-light', !lights);
  });

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/; max-age=31536000`;
  }

  function changeBackground() {
    lights = !lights;
    setCookie('lights', lights ? 'on' : 'off');
  }

  onMount(() => {
    const saved = getCookie('lights');
    if (saved === 'on' || saved === 'off') {
      lights = saved === 'on';
    } else {
      lights = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCookie('lights', lights ? 'on' : 'off');
    }

    let keyBuf = '';
    function onKey(e) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keyBuf = (keyBuf + e.key.toLowerCase()).slice(-6);
      if (keyBuf.endsWith('sonar'))  { keyBuf = ''; triggerAllWaves(); return; }
      if (keyBuf.endsWith('vercel') || keyBuf.endsWith('clerk')) {
        const variant = keyBuf.endsWith('vercel') ? 'vercel' : 'clerk';
        keyBuf = '';
        const spark = document.querySelector('.tl-spark');
        const rect  = spark.getBoundingClientRect();
        spawnWave(rect.left + rect.width / 2, rect.top + rect.height / 2, variant);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  let activeSonars = 0;
  const MAX_SONARS = 20;

  function pickVariant() {
    const r = Math.random() * 100;
    if (r < 0.5)  return 'rainbow';
    if (r < 1.5)  return 'mono';
    if (r < 2.0)  return 'matrix';
    if (r < 2.5)  return 'void';
    if (r < 3.0)  return 'glitch';
    if (r < 3.5)  return 'ripple';
    if (r < 4.0)  return 'gold';
    if (r < 4.5)  return 'slow-burn';
    if (r < 5.0)  return 'ghost';
    if (r < 5.5)  return 'vercel';
    if (r < 6.0)  return 'clerk';
    return 'default';
  }

  const ALL_VARIANTS = ['default', 'rainbow', 'mono', 'matrix', 'void', 'glitch', 'ripple', 'gold', 'slow-burn', 'ghost', 'vercel', 'clerk'];

  function triggerAllWaves() {
    const spark = document.querySelector('.tl-spark');
    const rect  = spark.getBoundingClientRect();
    const cx    = rect.left + rect.width / 2;
    const cy    = rect.top  + rect.height / 2;
    ALL_VARIANTS.forEach((v, i) => setTimeout(() => spawnWave(cx, cy, v), i * 1000));
  }

  function launchSonar(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    spawnWave(rect.left + rect.width / 2, rect.top + rect.height / 2, null);
  }

  function spawnWave(cx, cy, forcedVariant) {
    if (activeSonars >= MAX_SONARS) return;
    activeSonars++;

    const canvas = document.createElement('canvas');
    canvas.className = 'sonar-canvas';
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const variant  = forcedVariant ?? pickVariant();
    const DURATION = variant === 'slow-burn' ? 12000 : 5000;
    const SPEED    = variant === 'matrix'    ? 440
                   : variant === 'slow-burn' ? 55
                   : variant === 'vercel'    ? 260
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

    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      if (elapsed >= DURATION) {
        canvas.remove();
        activeSonars--;
        if (highlightEl) highlightEl.classList.remove('tl-company--lit');
        return;
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
        for (const { sx, sy, bornAt } of sources) {
          if (elapsed < bornAt) continue;
          const rw = bornAt === 0 ? ringW : ringW * 0.7;
          ctx.beginPath();
          ctx.arc(sx, sy, r + rw / 2, 0, Math.PI * 2, false);
          ctx.arc(sx, sy, Math.max(0, r - rw / 2), 0, Math.PI * 2, true);
          ctx.fillStyle = 'rgba(0,0,0,1)';
          ctx.fill('evenodd');
        }
        ctx.globalCompositeOperation = 'source-over';
      } else {
        for (const { sx, sy, a, bornAt } of sources) {
          if (elapsed < bornAt) continue;
          const remaining = DURATION - bornAt;
          const alpha = a * Math.max(0, 1 - (elapsed - bornAt) / remaining);
          if (alpha < 0.01) continue;

          if (variant === 'rainbow') {
            // createConicGradient: 2 fill calls instead of 72 stroke calls.
            // The browser renders the full spectrum natively via GPU.
            const grad = ctx.createConicGradient(0, sx, sy);
            for (let i = 0; i <= 12; i++) grad.addColorStop(i / 12, `hsl(${(i / 12) * 360},100%,58%)`);
            ctx.fillStyle = grad;

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
            color          = `rgba(255,255,255,${(alpha * 0.07).toFixed(3)})`;
            lineWidth      = 1;
            ctx.shadowBlur  = 0;
            ctx.shadowColor = 'transparent';
          } else if (variant === 'clerk') {
            color          = `rgba(108,71,255,${alpha.toFixed(3)})`;
            lineWidth      = 2;
            ctx.shadowBlur  = 14;
            ctx.shadowColor = `rgba(108,71,255,${(alpha * 0.7).toFixed(3)})`;
          } else {
            // default + slow-burn share the same orange look
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
  <meta property="og:image" content="https://paulogdm.com/assets/ogimage.svg" />
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
    <div class="me-size animated fadeIn" style="animation-delay: 0.1s">
      <img
        src="/assets/me.jpg"
        class="mx-auto d-block me-photo"
        alt="paulogdm"
        draggable="false"
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
    aria-label="Career timeline: Vercel Nov 2018 to Feb 2026, Clerk since June 2026"
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
        <span class="tl-spark" role="button" tabindex="-1" onclick={launchSonar}></span>
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
