<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  let lights = $state(true);
  let booting = $state(true);

  $effect(() => {
    document.body.classList.toggle('background-white', lights);
    document.body.classList.toggle('background-black', !lights);
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
      lights = true;
      setCookie('lights', 'on');
    }
    setTimeout(() => { booting = false; }, 3400);
  });
</script>

<svelte:head>
  <title>paulogdm</title>
  <meta property="og:title" content="paulogdm" />
  <meta property="og:description" content="Paulogdm personal page. Make yourself at home." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://paulogdm.com" />
  <meta property="og:image" content="https://paulogdm.com/assets/me.jpg" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@paulogdm" />
</svelte:head>

{#if booting}
<div class="boot-screen" out:fade={{ duration: 500 }}>
  <div class="boot-logo">
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="36" stroke="currentColor" stroke-width="1.5" stroke-dasharray="6 3" class="ring-rotate"/>
      <circle cx="40" cy="40" r="24" stroke="currentColor" stroke-width="1"/>
      <line x1="40" y1="16" x2="40" y2="24" stroke="currentColor" stroke-width="2.5"/>
      <line x1="40" y1="56" x2="40" y2="64" stroke="currentColor" stroke-width="2.5"/>
      <line x1="16" y1="40" x2="24" y2="40" stroke="currentColor" stroke-width="2.5"/>
      <line x1="56" y1="40" x2="64" y2="40" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="40" cy="40" r="5" fill="currentColor"/>
      <circle cx="40" cy="40" r="2" fill="#07090C"/>
    </svg>
  </div>
  <div class="boot-log">
    <div class="boot-line" style="--d:0.1s">SHD NETWORK v4.2.1 INITIALIZING...</div>
    <div class="boot-line" style="--d:0.7s">BIOMETRIC AUTHENTICATION: VERIFIED</div>
    <div class="boot-line" style="--d:1.3s">AGENT PROFILE DECRYPTION: COMPLETE</div>
    <div class="boot-line" style="--d:1.9s">LOCATION SERVICES: ACTIVE</div>
    <div class="boot-line active" style="--d:2.5s">FIELD STATUS: <span>OPERATIONAL</span></div>
  </div>
</div>

{:else}

<div class="hud-container" in:fade={{ duration: 600 }}>

  <div class="classification-bar">
    SHD NETWORK // AUTHORIZED PERSONNEL ONLY // CLASSIFICATION: UNRESTRICTED
  </div>

  <header class="hud-header">
    <div class="header-left">
      <svg class="shd-icon" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2" class="ring-rotate"/>
        <circle cx="20" cy="20" r="11" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="9" x2="20" y2="13" stroke="currentColor" stroke-width="2"/>
        <line x1="20" y1="27" x2="20" y2="31" stroke="currentColor" stroke-width="2"/>
        <line x1="9" y1="20" x2="13" y2="20" stroke="currentColor" stroke-width="2"/>
        <line x1="27" y1="20" x2="31" y2="20" stroke="currentColor" stroke-width="2"/>
        <circle cx="20" cy="20" r="2.5" fill="currentColor"/>
      </svg>
      <span class="header-label">SHD NETWORK</span>
    </div>
    <div class="header-right">
      <span class="status-dot"></span>
      <span class="mono dim">AGENT_ONLINE</span>
    </div>
  </header>

  <main class="agent-stage">
    <div class="agent-card">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>

      <div class="card-inner">

        <div class="photo-col">
          <div class="photo-frame">
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
            <img src="/assets/me.jpg" alt="paulogdm" class="agent-photo" draggable="false">
            <div class="photo-scan"></div>
            <div class="photo-badge">IDENTITY VERIFIED</div>
          </div>
          <div class="gear-readout">
            <span class="mono dim small">GEAR SCORE</span>
            <span class="mono orange large">500</span>
          </div>
        </div>

        <div class="info-col">
          <div class="mono dim small lspaced">AGENT // ALPHA-1</div>
          <h1 class="agent-name">paulogdm</h1>
          <div class="status-row">
            <span class="pulse-dot"></span>
            <span class="mono small">STATUS: <span class="orange">ACTIVE</span></span>
          </div>
          <div class="mono dim small lspaced" style="margin-top:0.2rem">STRATEGIC HOMELAND DIVISION</div>

          <div class="divider"></div>

          <div class="mono dim small lspaced" style="margin-bottom:0.65rem">// SECURE CHANNELS</div>
          <div class="link-grid">
            <a class="link-item" href="&#77;&#97;&#73;&#76;&#84;&#79;&#58;&#109;&#101;&#64;&#112;&#97;&#117;&#108;&#111;&#103;&#100;&#109;&#46;&#99;&#111;&#109;" target="_blank" rel="noopener noreferrer" aria-label="Email">
              <i class="far fa-envelope fa-fw"></i><span>EMAIL</span>
            </a>
            <a class="link-item" href="https://x.com/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="X">
              <i class="fab fa-x-twitter fa-fw"></i><span>X</span>
            </a>
            <a class="link-item" href="https://www.linkedin.com/in/paulogdm/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i class="fab fa-linkedin-in fa-fw"></i><span>LINKEDIN</span>
            </a>
            <a class="link-item" href="https://github.com/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <i class="fab fa-github fa-fw"></i><span>GITHUB</span>
            </a>
            <a class="link-item" href="https://stackoverflow.com/users/2665655/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="Stack Overflow">
              <i class="fab fa-stack-overflow fa-fw"></i><span>S. OVERFLOW</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  </main>

  <footer class="hud-footer">
    <button onclick={changeBackground} class="mode-btn" aria-label="Toggle light/dark mode">
      <i class="far fa-lightbulb fa-fw"></i>
      <span class="mono small">{lights ? 'NIGHT_OPS' : 'DAYLIGHT'}</span>
    </button>
    <div class="mono dim small">CLASSIFICATION: UNRESTRICTED</div>
    <div class="mono dim small">38.8951°N 77.0369°W</div>
  </footer>

</div>
{/if}
