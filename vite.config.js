import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter({
        pages: "build",
        assets: "build",
        fallback: null,
        strict: true,
      }),
      // Prerendered pages get this as a <meta> tag, with SvelteKit adding hashes
      // for its own inline bootstrap script. frame-ancestors is ignored in a
      // <meta>, so it lives in vercel.json. 'unsafe-inline' is only for styles:
      // the timeline, photo drag, and entrance delays use style attributes. The
      // theme script in app.html needs no hash because it runs before this <meta>
      // is parsed, so keep it above %sveltekit.head%.
      csp: {
        mode: "hash",
        directives: {
          "default-src": ["self"],
          "script-src": ["self"],
          "style-src": ["self", "unsafe-inline"],
          "img-src": ["self", "data:"],
          "font-src": ["self"],
          "connect-src": ["self"],
          "object-src": ["none"],
          "base-uri": ["self"],
          "form-action": ["none"],
        },
      },
    }),
  ],
});
