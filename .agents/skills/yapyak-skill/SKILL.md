---
name: yapyak-skill
description: "The public agent skill in `skills/yapyak`: its layout, the change-to-edit table that keeps it current, and how its prose is written. Use when a change touches a public export, a config field, a CLI command, a diagnostic, an adapter, or guide content."
metadata:
  internal: true
---

`skills/yapyak` is the public Agent Skill, installed by users through `npx skills add yapyak/yapyak` or `/plugin install yapyak --marketplace yapyak/yapyak`. Land a behavior change and its line in the skill in the same change: one commit, or one series of commits per [[yapyak-commit]].

### Layout

| Path | Holds |
| --- | --- |
| `skills/yapyak/SKILL.md` | Every framework-independent rule: install, `t()`, ICU, formatting, locale, config, locale files, translators, CLI, build, diagnostics triage |
| `skills/yapyak/references/<adapter>.md` | One file per adapter package: `react`, `vue`, `svelte`, `astro`, `nuxt`, `react-router`, `sveltekit`, `tanstack-start` |
| `skills/yapyak/references/diagnostics.md` | One row per live `YAPnnnn` diagnostic |
| `skills/.claude-plugin/plugin.json` | The Claude Code plugin manifest; `skills` points at `./`, `version` is the skill's own semver |
| `.claude-plugin/marketplace.json` | The Claude Code marketplace; one plugin, `source: ./skills` |
| `.agents/skills/*` | Internal rule skills; every frontmatter carries `metadata.internal: true` so `npx skills add` hides them |

Never add a skill directory outside `skills/` and `.agents/skills/` → put a public skill under `skills/<name>/` and an internal one under `.agents/skills/` with `metadata.internal: true`.

### Change-to-edit table

Edit the skill in the same change. A change matching several rows edits every matching place.

| Change | Edit |
| --- | --- |
| Export added, renamed, or removed in `yapyak`, `yapyak/config`, `yapyak/translator`, `yapyak/adapter`, `yapyak/processor`, or an adapter's main entry | The `SKILL.md` section that lists it; the adapter's reference file when the export belongs to one adapter |
| `YapyakConfig` field added, removed, or default changed | The config table in `SKILL.md` |
| Persistence strategy or option changed | The persistence table in `SKILL.md` |
| CLI command or flag added, removed, or renamed | The CLI table in `SKILL.md` |
| `YAPnnnn` allocated (the third artifact in [[yapyak-diagnostic]]) | A row in `references/diagnostics.md`, in code order |
| `YAPnnnn` retired | Its row deleted from `references/diagnostics.md` |
| Adapter package added | `references/<adapter>.md` in the section order below; a row in the framework table in `SKILL.md`; the install table in `SKILL.md` |
| Framework binding, `RichText` shape, or SSR setup changed in an adapter | That adapter's reference file |
| Guide page states a behavior the skill does not, or contradicts it | The rule in `SKILL.md` or the reference file; the guide page is the canonical home per [[yapyak-documentation]], the skill restates it as a rule |
| Translator option or shipped translator changed | The translator tables in `SKILL.md` |
| Processor option added or removed | The processor rule in `SKILL.md` and the adapter's reference file |

A changeset for `yapyak`, `@yapyak/vite`, or an adapter that touches none of the rows above needs no skill edit.

Bump the patch digit of `version` in `skills/.claude-plugin/plugin.json` in every change that touches a file under `skills/`, whatever the change. The skill is `0.0.x` until yapyak reaches 1.0.0; minor and major follow the same release decision as the packages, per [[yapyak-package]] § Changeset bumps.

### Reference file section order

Every `references/<adapter>.md` carries these `###` sections, in this order, and no others. A section the adapter has no content for is omitted, never left empty.

1. Packages
2. Build config
3. `yapyak.config.ts`
4. Types
5. Where `t()` works
6. Component
7. Locale
8. Text direction
9. Locale switcher
10. Rich text
11. SSR
12. Fixed-locale build
13. Quirks

### Prose

- Write every rule line per [[yapyak-style]] T1–T9: imperative, one rule per line, a `✓`/`✗` code pair in place of an explanation. Put API facts (exports, signatures, defaults, options) in a table.
- Address the agent in the imperative. Never write "we", "you can", or "yapyak knows".
- Use the locked words in [[yapyak-terminology]].
- Use the canonical examples from [[yapyak-documentation]]: `t('Save changes')`, `SaveButton`, `save-button.<ext>`, `en` → `sv`.
- Verify every claim against code before writing it, per [[yapyak-workflow]] § Verify against code. Copy setup code from `examples/*` or `docs/content/guide/*`; never compose a setup from memory.
- Write plain Markdown. Never use a Markdoc tag (`{% switch %}`, `{% diagnostics %}`, `{% callout %}`); one adapter per reference file replaces the framework switch.
- Keep `SKILL.md` ≤ 500 lines and each reference file ≤ 400 lines → move detail into the reference files, never into a third level.
- Link a reference file from `SKILL.md` by relative path: `references/react.md`.
- Keep the frontmatter to `name`, `description`, `license`, and `metadata`. `name` equals the directory name. `description` names what the skill covers, when to use it, and the keywords an agent matches on: package names, `t()`, `YAPnnnn`, framework names.
- Never set `metadata.internal` on the public skill.

### Verify

Run after every skill edit:

```bash
claude plugin validate skills
claude plugin validate .claude-plugin/marketplace.json
npx skills add . --list
```

The `--list` output names exactly one skill, `yapyak`. An internal skill in the list means a missing `metadata.internal: true`.
