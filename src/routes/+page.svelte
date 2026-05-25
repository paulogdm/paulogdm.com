<script>
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';
  import lightbulbIcon     from '@iconify-icons/lucide/lightbulb';
  import mailIcon          from '@iconify-icons/lucide/mail';
  import calendarIcon      from '@iconify-icons/lucide/calendar';
  import githubIcon        from '@iconify-icons/simple-icons/github';
  import linkedinIcon      from '@iconify-icons/simple-icons/linkedin';
  import xIcon             from '@iconify-icons/simple-icons/x';
  import stackoverflowIcon from '@iconify-icons/simple-icons/stackoverflow';

  let lights = $state(false);

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
      lights = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCookie('lights', lights ? 'on' : 'off');
    }
  });

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
  <div class="px-4 py-4 clearfix">
    <button
      onclick={changeBackground}
      class="lightbulb float-left animated fadeIn p-2"
      aria-label="Toggle light/dark mode"
      style="animation-delay: 0s"
    >
      <Icon icon={lightbulbIcon} width="2em" />
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
      <nav class="social-links mt-3" aria-label="Useful links">
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
        <div class="tl-company tl-clerk" data-tenure="Since June 2026">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="m21.47 20.829-2.881-2.881a.572.572 0 0 0-.7-.084 6.854 6.854 0 0 1-7.081 0 .576.576 0 0 0-.7.084l-2.881 2.881a.576.576 0 0 0-.103.69.57.57 0 0 0 .166.186 12 12 0 0 0 14.113 0 .58.58 0 0 0 .239-.423.576.576 0 0 0-.172-.453Zm.002-17.668-2.88 2.88a.569.569 0 0 1-.701.084A6.857 6.857 0 0 0 8.724 8.08a6.862 6.862 0 0 0-1.222 3.692 6.86 6.86 0 0 0 .978 3.764.573.573 0 0 1-.083.699l-2.881 2.88a.567.567 0 0 1-.864-.063A11.993 11.993 0 0 1 6.771 2.7a11.99 11.99 0 0 1 14.637-.405.566.566 0 0 1 .232.418.57.57 0 0 1-.168.448Zm-7.118 12.261a3.427 3.427 0 1 0 0-6.854 3.427 3.427 0 0 0 0 6.854Z"/>
          </svg>
          Clerk
        </div>
        <div class="tl-company tl-vercel" data-tenure="Nov 2018 to Feb 2026">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="m12 1.608 12 20.784H0Z"/>
          </svg>
          Vercel
        </div>
      </div>
      <div class="tl-track" aria-hidden="true">
        <span class="tl-spark"></span>
        <span class="tl-vercel-seg"></span>
      </div>
      <div class="tl-years" aria-hidden="true">
        <span class="tl-yr tl-yr-now">now</span>
        <span class="tl-yr" style="left: 27%">'24</span>
        <span class="tl-yr" style="left: 51%">'22</span>
        <span class="tl-yr" style="left: 75%">'20</span>
        <span class="tl-yr tl-yr-end">'18</span>
      </div>
    </div>
  </section>
</div>
