<script>
  import { page } from '$app/stores';
  import ErrorScreen from '$lib/ErrorScreen.svelte';
</script>

<svelte:head>
  <title>{$page.status} · paulogdm</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<ErrorScreen status={$page.status} message={$page.error?.message ?? ''} />
