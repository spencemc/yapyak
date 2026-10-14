---
title: Names
order: 5
---

`format.displayName()` returns the name of a language, region, script, currency, calendar, or date-time field for the active locale. It wraps [`Intl.DisplayNames`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames) and reads the active locale on every call.

```ts
import { format } from 'yapyak';

format.displayName('sv', 'language');
// output:
// en: 'Swedish'
// sv: 'svenska'
// de: 'Schwedisch'
```

The second argument says what kind of code the first is: `'language'`, `'region'`, `'script'`, `'currency'`, `'calendar'`, or `'dateTimeField'`.

## Native names

A language menu shows each locale in its own language. Scope the call to the locale it names with [`format.in()`](/guide/formatting/overrides):

```ts
import { format, locales } from 'yapyak';

locales.map((value) => format.in(value).displayName(value, 'language'));
// output: ['English', 'svenska']
```

The names come from the `Intl` data in the browser or in Node, so a locale added with [`yapyak add`](/reference/cli/add) shows up in the menu without a new source string. See [Switch](/guide/switching/switch#rendering-a-locale-switcher) for the component.

## Languages

A full tag names the script and region too:

```ts
format.displayName('zh-Hant-TW', 'language');
// output:
// en: 'Chinese (Traditional, Taiwan)'
// sv: 'kinesiska (traditionell, Taiwan)'
```

`languageDisplay` picks between the dialect name and the language with its region in parentheses:

```ts
format.displayName('en-US', 'language');
// output: en: 'American English'
```

```ts
format.displayName('en-US', 'language', { languageDisplay: 'standard' });
// output: en: 'English (United States)'
```

`style: 'short'` and `style: 'narrow'` shorten the name where the locale has a short form:

```ts
format.displayName('en-US', 'language', { style: 'short' });
// output: en: 'US English'
```

## Regions and currencies

```ts
format.displayName('DE', 'region');
// output:
// en: 'Germany'
// sv: 'Tyskland'
// ja: 'ドイツ'
```

```ts
format.displayName('EUR', 'currency');
// output:
// en: 'Euro'
// sv: 'euro'
```

A region is an ISO 3166 code, a currency an ISO 4217 code.

## Unknown codes

A code the runtime parses but has no name for renders as the code: `format.displayName('xx', 'language')` returns `'xx'`. A code the runtime rejects, `'not a tag'` as a language, renders as the code too and reports [`YAP0056`](/reference/diagnostics/YAP0056) once.

## Inside a translation

ICU MessageFormat has no name sub-format. Render the name first and pass it in as a placeholder:

```ts
const language = format.in('sv').displayName('sv', 'language');

t('Switch to {language}', { language });
// output: en: 'Switch to svenska'
```
