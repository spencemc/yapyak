import { fileURLToPath } from 'node:url';

type Mode = 'dev' | 'prod';

type SaveLoop = {
  fileId: string;
  sourceAnchor: string;
  sourceInsertion: string;
  sourcePath: string;
  ssrHtml: boolean;
};

export type Example = {
  name: string;
  persistence: 'cookie' | 'local-storage' | 'url';
  port: number;
  saveLoop?: SaveLoop;
  serve: 'preview' | 'start';
  switchLocaleOnServer: boolean;
};

const MODE: Mode = process.env.YAPYAK_E2E_MODE === 'prod' ? 'prod' : 'dev';

export const IS_PROD = MODE === 'prod';

const PROD_PORT_OFFSET = 100;

export const SANDBOX_PORT = 5320;

export const EXAMPLES: Example[] = [
  {
    name: 'astro-cookie',
    persistence: 'cookie',
    port: 5301,
    saveLoop: {
      fileId: 'src/pages/index.astro',
      sourceAnchor: "<h2>{t('Dates and times')}</h2>",
      sourceInsertion:
        "<h2>{t('Dates and times')}</h2><p>{t('Probe from the save loop')}</p>",
      sourcePath: 'src/pages/index.astro',
      ssrHtml: true,
    },
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'astro-url',
    persistence: 'url',
    port: 5311,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-compiler-vanilla-cookie',
    persistence: 'cookie',
    port: 5321,
    saveLoop: {
      fileId: 'src/app.tsx',
      sourceAnchor: "<h2>{t('Dates and times')}</h2>",
      sourceInsertion:
        "<h2>{t('Dates and times')}</h2><p>{t('Probe from the save loop')}</p>",
      sourcePath: 'src/app.tsx',
      ssrHtml: false,
    },
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-react-router-cookie',
    persistence: 'cookie',
    port: 5302,
    saveLoop: {
      fileId: 'app/routes/home.tsx',
      sourceAnchor: "<h2>{t('Dates and times')}</h2>",
      sourceInsertion:
        "<h2>{t('Dates and times')}</h2><p>{t('Probe from the save loop')}</p>",
      sourcePath: 'app/routes/home.tsx',
      ssrHtml: true,
    },
    serve: 'start',
    switchLocaleOnServer: true,
  },
  {
    name: 'react-react-router-url',
    persistence: 'url',
    port: 5303,
    serve: 'start',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-tanstack-start-cookie',
    persistence: 'cookie',
    port: 5304,
    saveLoop: {
      fileId: 'src/routes/index.tsx',
      sourceAnchor: "<h2>{t('Dates and times')}</h2>",
      sourceInsertion:
        "<h2>{t('Dates and times')}</h2><p>{t('Probe from the save loop')}</p>",
      sourcePath: 'src/routes/index.tsx',
      ssrHtml: true,
    },
    serve: 'preview',
    switchLocaleOnServer: true,
  },
  {
    name: 'react-tanstack-start-url',
    persistence: 'url',
    port: 5305,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-vanilla-cookie',
    persistence: 'cookie',
    port: 5312,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5306,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'react-vanilla-url',
    persistence: 'url',
    port: 5313,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-sveltekit-cookie',
    persistence: 'cookie',
    port: 5307,
    saveLoop: {
      fileId: 'src/routes/+page.svelte',
      sourceAnchor: '<h2>{t("Dates and times")}</h2>',
      sourceInsertion:
        '<h2>{t("Dates and times")}</h2><p>{t("Probe from the save loop")}</p>',
      sourcePath: 'src/routes/+page.svelte',
      ssrHtml: true,
    },
    serve: 'preview',
    switchLocaleOnServer: true,
  },
  {
    name: 'svelte-sveltekit-url',
    persistence: 'url',
    port: 5308,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-vanilla-cookie',
    persistence: 'cookie',
    port: 5314,
    saveLoop: {
      fileId: 'src/app.svelte',
      sourceAnchor: '<h2>{t("Dates and times")}</h2>',
      sourceInsertion:
        '<h2>{t("Dates and times")}</h2><p>{t("Probe from the save loop")}</p>',
      sourcePath: 'src/app.svelte',
      ssrHtml: false,
    },
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5309,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'svelte-vanilla-url',
    persistence: 'url',
    port: 5315,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'vue-nuxt-cookie',
    persistence: 'cookie',
    port: 5318,
    saveLoop: {
      fileId: 'app/app.vue',
      sourceAnchor: "<h2>{{ t('Dates and times') }}</h2>",
      sourceInsertion:
        "<h2>{{ t('Dates and times') }}</h2><p>{{ t('Probe from the save loop') }}</p>",
      sourcePath: 'app/app.vue',
      ssrHtml: true,
    },
    serve: 'start',
    switchLocaleOnServer: true,
  },
  {
    name: 'vue-nuxt-url',
    persistence: 'url',
    port: 5319,
    serve: 'start',
    switchLocaleOnServer: false,
  },
  {
    name: 'vue-vanilla-cookie',
    persistence: 'cookie',
    port: 5316,
    saveLoop: {
      fileId: 'src/app.vue',
      sourceAnchor: "<h2>{{ t('Dates and times') }}</h2>",
      sourceInsertion:
        "<h2>{{ t('Dates and times') }}</h2><p>{{ t('Probe from the save loop') }}</p>",
      sourcePath: 'src/app.vue',
      ssrHtml: false,
    },
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'vue-vanilla-local-storage',
    persistence: 'local-storage',
    port: 5310,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
  {
    name: 'vue-vanilla-url',
    persistence: 'url',
    port: 5317,
    serve: 'preview',
    switchLocaleOnServer: false,
  },
];

export function resolvePort(example: Example): number {
  return IS_PROD ? example.port + PROD_PORT_OFFSET : example.port;
}

export function toBaseURL(port: number): string {
  return `http://localhost:${port}`;
}

export function toExamplePath(example: Example, relativePath: string): string {
  return fileURLToPath(
    new URL(`../../examples/${example.name}/${relativePath}`, import.meta.url),
  );
}
