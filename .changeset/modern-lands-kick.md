---
'@yapyak/sveltekit': patch
---

Require SvelteKit 3. SvelteKit 3 moved the `Handle` type to `@sveltejs/kit/hooks`, where SvelteKit 2 does not export it, so a handle typed against the old import became `any` in a SvelteKit 3 app without a compile error. The adapter now imports the type from `@sveltejs/kit/hooks` and declares `@sveltejs/kit >=3` as its peer dependency. See `BREAKING.md` for the upgrade steps.
