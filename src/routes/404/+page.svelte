<script>
  import ErrorScreen from "$lib/ErrorScreen.svelte";
</script>

<svelte:head>
  <title>404 · paulogdm</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<!-- Prerendered to build/404.html — static hosts (Vercel) serve this for
     unknown URLs, so the branded content is baked in with no JS or flash. -->
<ErrorScreen status={404} />
