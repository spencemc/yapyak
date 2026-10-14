---
'yapyak': patch
---

Add `format.displayName()`, the fifth `format` method, backed by `Intl.DisplayNames`. It returns the name of a language, region, script, currency, calendar, or date-time field code for the active locale, so a locale switcher can label every added locale with `format.in(value).displayName(value, 'language')` instead of a `t()` call per language. A code the runtime rejects renders as the code itself and reports `YAP0056` once.
