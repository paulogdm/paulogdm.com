<script>
  import { onMount } from 'svelte';

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
  <meta property="og:image" content="https://paulogdm.com/assets/me.jpg" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:site" content="@paulogdm" />
</svelte:head>

<div class="container">
  <div class="px-4 py-4 clearfix">
    <button
      onclick={changeBackground}
      class="lightbulb float-left animated fadeIn p-2"
      aria-label="Toggle light/dark mode"
    >
      <i class="far fa-lightbulb fa-fw fa-2x"></i>
    </button>
  </div>

  <div class="my-4 text-center align-middle">
    <div class="me-size animated fadeIn">
      <img
        src="/assets/me.jpg"
        class="mx-auto d-block {lights ? 'me-white' : 'me-black'}"
        style="display:none;"
        alt=""
        draggable="false"
      >
    </div>

    <div class="my-5 py-2 animated fadeIn">
      <h1>paulogdm</h1>
      <h6 class="mt-3" aria-label="Useful links">
        <a class="mx-2" href="&#77;&#97;&#73;&#76;&#84;&#79;&#58;&#109;&#101;&#64;&#112;&#97;&#117;&#108;&#111;&#103;&#100;&#109;&#46;&#99;&#111;&#109;" target="_blank" rel="noopener noreferrer" aria-label="Email">
          <i class="far fa-envelope fa-fw fa-lg"></i>
        </a>
        <a class="mx-2" href="https://x.com/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="X">
          <i class="fab fa-x-twitter fa-fw fa-lg"></i>
        </a>
        <a class="mx-2" href="https://www.linkedin.com/in/paulogdm/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <i class="fab fa-linkedin-in fa-fw fa-lg"></i>
        </a>
        <a class="mx-2" href="https://github.com/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <i class="fab fa-github fa-fw fa-lg"></i>
        </a>
        <a class="mx-2" href="https://stackoverflow.com/users/2665655/paulogdm" target="_blank" rel="noopener noreferrer" aria-label="Stack Overflow">
          <i class="fab fa-stack-overflow fa-fw fa-lg"></i>
        </a>
      </h6>
    </div>
  </div>
</div>
