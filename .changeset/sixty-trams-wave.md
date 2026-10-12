---
'yapyak': patch
---

Leave the hook out of a component called as a plain function in its own module. The compiler injected `useYapyak()` into every component holding JSX, so a component called as a plain function, `Row(props)` or `items.map(Row)` instead of `<Row />`, ran the hook inside its caller, and React threw "Rendered more hooks than during the previous render" as soon as the number of calls changed. Such a component now gets no hook: it runs inside the component that called it, and that component re-renders. Calling a component as a function also counts as component evidence, so the caller gets the hook even without JSX of its own.
