---
'@yapyak/vite': patch
---

Keep yapyak's runtime bundled when a framework externalizes it through a Vite environment. SvelteKit 3 with adapter-node 6 sets `noExternal: true` and lists the app's `dependencies` as `external` on the `ssr` environment, so `yapyak` was left to be loaded from `node_modules` on the server with no locales: `isLocale()` answered false, `setLocale()` was ignored, and every SSR page rendered the source language. The plugin now removes `yapyak` and `@yapyak/*` from `resolve.external` of every server environment in `configResolved`, in place of the legacy `ssr.external` field that Vite 8 only mirrors.
