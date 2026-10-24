import { describe } from 'vitest';

import { EXAMPLES, resolvePort, toBaseURL, toExamplePath } from './example';
import { expect, test } from './test';
import { readFile, writeFile } from 'node:fs/promises';

const MARKER_SOURCE = 'Dates and times';
const MARKER_BASELINE = 'Datum och tider';
const PROBE_SOURCE = 'Probe from the save loop';

describe.for(EXAMPLES.filter((example) => example.saveLoop !== undefined))(
  '$name',
  (example) => {
    const saveLoop = example.saveLoop;
    if (saveLoop === undefined) {
      throw new Error(`${example.name} has no save loop`);
    }
    const baseURL = toBaseURL(resolvePort(example));
    const catalogFileId = saveLoop.fileId;
    const catalogPath = toExamplePath(example, 'locales/sv.json');
    const { sourceAnchor, sourceInsertion } = saveLoop;
    const sourcePath = toExamplePath(example, saveLoop.sourcePath);

    let originalCatalog = '';
    let originalSource = '';

    test.override({
      allowHydrationMismatch: true,
      baseURL,
    });

    test.beforeEach(async () => {
      originalCatalog = await readFile(catalogPath, 'utf8');
      originalSource = await readFile(sourcePath, 'utf8');
    });

    test.afterEach(async () => {
      await writeFile(sourcePath, originalSource);
      await writeFile(catalogPath, originalCatalog);
    });

    test.skipIf(!saveLoop.ssrHtml)(
      'renders fresh SSR HTML on the next request after a locale file save',
      async () => {
        for (const value of [
          `${MARKER_BASELINE} (runda ett)`,
          `${MARKER_BASELINE} (den andra rundan)`,
        ]) {
          await writeMarker(catalogPath, catalogFileId, value);
          await expect(async () => {
            const response = await fetch(new URL('/', baseURL), {
              headers: {
                cookie: 'locale=sv',
              },
            });
            expect(await response.text()).toContain(value);
          }).toPass();
        }
      },
    );

    test('renders the fresh translation in the browser after a locale file save', async ({
      context,
      page,
    }) => {
      await context.addCookies([
        {
          name: 'locale',
          url: baseURL,
          value: 'sv',
        },
      ]);
      await page.goto('/');
      await expect(page.getByText(MARKER_BASELINE).first()).toBeVisible();
      await page.waitForLoadState('networkidle');

      const value = `${MARKER_BASELINE} (i webbläsaren)`;
      await writeMarker(catalogPath, catalogFileId, value);
      await expect(page.getByText(value)).toBeVisible();

      await page.reload();
      await expect(page.getByText(value)).toBeVisible();
    });

    test('writes the stub when a new `t()` call is saved', async ({
      context,
      page,
    }) => {
      if (!originalSource.includes(sourceAnchor)) {
        throw new Error(`${sourceAnchor} is missing in ${sourcePath}`);
      }
      await context.addCookies([
        {
          name: 'locale',
          url: baseURL,
          value: 'sv',
        },
      ]);
      await page.goto('/');
      await expect(page.getByText(MARKER_BASELINE).first()).toBeVisible();
      await page.waitForLoadState('networkidle');

      await writeFile(
        sourcePath,
        originalSource.replace(sourceAnchor, sourceInsertion),
      );

      await expect(page.getByText(PROBE_SOURCE)).toBeVisible();
      await expect(async () => {
        const catalog: Record<string, Record<string, string>> = JSON.parse(
          await readFile(catalogPath, 'utf8'),
        );
        expect(catalog[catalogFileId]).toHaveProperty([
          PROBE_SOURCE,
        ]);
      }).toPass();

      await writeFile(sourcePath, originalSource);
      await expect(async () => {
        const catalog: Record<string, Record<string, string>> = JSON.parse(
          await readFile(catalogPath, 'utf8'),
        );
        expect(catalog[catalogFileId]).not.toHaveProperty([
          PROBE_SOURCE,
        ]);
      }).toPass();
    });
  },
);

async function writeMarker(
  catalogPath: string,
  catalogFileId: string,
  value: string,
): Promise<void> {
  const catalog: Record<string, Record<string, string>> = JSON.parse(
    await readFile(catalogPath, 'utf8'),
  );
  const entries = catalog[catalogFileId];
  if (entries === undefined) {
    throw new Error(`${catalogFileId} is missing in ${catalogPath}`);
  }
  entries[MARKER_SOURCE] = value;
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
}
