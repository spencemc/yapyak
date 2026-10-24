import { defineConfig } from 'vitest/config';

import { IS_PROD } from './src/example';

const IS_CI = process.env.CI !== undefined;

export default defineConfig({
  test: {
    allowOnly: !IS_CI,
    globalSetup: './src/web-server.ts',
    hookTimeout: 30_000,
    projects: [
      {
        extends: true,
        test: {
          include: [
            'src/example.spec.ts',
          ],
          name: 'example',
        },
      },
      ...(IS_PROD
        ? []
        : [
            {
              extends: true,
              test: {
                include: [
                  'src/save-loop.spec.ts',
                ],
                name: 'sandbox',
              },
            },
            {
              // Runs after `example`: these specs edit the example sources
              // the `example` specs render.
              extends: true,
              test: {
                include: [
                  'src/example-save-loop.spec.ts',
                ],
                name: 'example-save-loop',
                sequence: {
                  groupOrder: 1,
                },
              },
            },
          ]),
    ],
    retry: IS_CI ? 2 : 0,
    testTimeout: 30_000,
  },
});
