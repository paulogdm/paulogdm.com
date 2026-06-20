<script>
  // Shared branded error UI. Used by the prerendered /404 page (static hosts
  // serve build/404.html for unknown URLs) and by +error.svelte for any
  // runtime error inside the app.
  let { status = 404, message = "" } = $props();

  // 404 gets bespoke copy nodding to the site's "make yourself at home" line;
  // anything else shows a generic message plus the real error text if present.
  let isNotFound = $derived(status === 404);
  let headline = $derived(isNotFound ? "This page isn't home." : "Something went sideways.");
  let detail = $derived(
    isNotFound
      ? "The page you're after doesn't exist — or it packed up and moved."
      : message || "An unexpected error occurred.",
  );
</script>

<main class="err">
  <p class="code animated fadeIn">{status}</p>
  <h1 class="headline animated fadeIn" style="animation-delay: 0.1s">{headline}</h1>
  <p class="sub animated fadeIn" style="animation-delay: 0.2s">{detail}</p>

  <a class="cta animated fadeIn" href="/" style="animation-delay: 0.3s">
    Make yourself at home
    <span class="arrow" aria-hidden="true">→</span>
  </a>
</main>

<style>
  .err {
    /* Force Inter for everything here. The headline is an <h1>, and the global
       stylesheet sets h1 { font-family: 'Syne' } — an element rule that beats
       inheritance — so .headline below also sets it explicitly to win on
       specificity. */
    font-family: "Inter Variable", sans-serif;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem 1.5rem;
  }

  .code {
    font-weight: 600;
    font-size: clamp(4.5rem, 18vw, 9rem);
    line-height: 0.95;
    margin: 0;
  }

  .headline {
    font-family: "Inter Variable", sans-serif; /* override global h1 { Syne } */
    font-weight: 500;
    font-size: clamp(1.35rem, 5vw, 2rem);
    margin: 0.6rem 0 0;
  }

  .sub {
    margin: 0.75rem 0 0;
    max-width: 28rem;
    opacity: 0.55;
    font-size: 0.95rem;
    line-height: 1.6;
  }

  /* Primary action — a pill button that reads clearly as "go home". */
  .cta {
    margin-top: clamp(1.75rem, 5vh, 2.5rem);
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.7rem 1.4rem;
    border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
    border-radius: 999px;
    font-size: 0.95rem;
    transition:
      border-color 0.25s ease,
      color 0.25s ease;
  }
  .cta:hover {
    border-color: var(--accent);
  } /* colour comes from global a:hover */

  .arrow {
    transition: transform 0.25s ease;
  }
  .cta:hover .arrow {
    transform: translateX(3px);
  }

  @media (prefers-reduced-motion: reduce) {
    .arrow {
      transition: none;
    }
  }
</style>
