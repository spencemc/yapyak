import type { Locator } from 'playwright';

import { expect } from 'vitest';

import { setTimeout } from 'node:timers/promises';

type Probe = {
  actual: unknown;
  pass: boolean;
};

type PollOptions = {
  timeout?: number;
};

declare module 'vitest' {
  // biome-ignore lint/style/useConsistentTypeDefinitions: yap yap yap
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown,
  > {
    toBeVisible(options?: PollOptions): Promise<void>;
    toHaveAttribute(
      name: string,
      value: string,
      options?: PollOptions,
    ): Promise<void>;
    toHaveCount(count: number, options?: PollOptions): Promise<void>;
    toHaveText(
      expected: string | string[],
      options?: PollOptions,
    ): Promise<void>;
    toHaveValue(value: string, options?: PollOptions): Promise<void>;
    toPass(options?: PollOptions): Promise<void>;
  }
}

const EXPECT_TIMEOUT = 5000;

const TO_PASS_TIMEOUT = 25_000;

const LOCATOR_INTERVALS = [
  0,
  20,
  50,
  100,
  100,
  500,
];

const TO_PASS_INTERVALS = [
  100,
  250,
  500,
  1000,
];

function normalizeWhiteSpace(text: string): string {
  return text.replace(/[​­]/g, '').trim().replace(/\s+/g, ' ');
}

function assertLocator(received: unknown): asserts received is Locator {
  if (
    typeof received !== 'object' ||
    received === null ||
    !('evaluateAll' in received)
  ) {
    throw new TypeError('Expected a Playwright `Locator`');
  }
}

class StrictModeViolation extends Error {}

// Locator assertions are strict like Playwright's: matching several elements
// fails at once instead of retrying.
function toSingle<T>(locator: Locator, values: T[]): T | undefined {
  if (values.length > 1) {
    throw new StrictModeViolation(
      `strict mode violation: ${locator} resolved to ${values.length} elements`,
    );
  }
  return values[0];
}

async function poll(
  probe: () => Promise<Probe>,
  isNot: boolean,
  timeout: number,
  intervals: number[],
): Promise<Probe> {
  const deadline = Date.now() + timeout;
  const remaining = [
    ...intervals,
  ];
  // Vitest leaves `isNot` undefined on non-negated assertions.
  const negated = isNot === true;
  while (true) {
    let result: Probe;
    try {
      result = await probe();
    } catch (error) {
      // A navigation mid-probe destroys the execution context; retry like
      // Playwright's own assertions do.
      if (error instanceof StrictModeViolation) {
        throw error;
      }
      result = {
        actual: error instanceof Error ? error.message : error,
        pass: negated,
      };
    }
    if (result.pass !== negated || Date.now() >= deadline) {
      return result;
    }
    await setTimeout(remaining.shift() ?? intervals.at(-1) ?? 0);
  }
}

expect.extend({
  async toBeVisible(received: unknown, options: PollOptions = {}) {
    assertLocator(received);
    const { actual, pass } = await poll(
      async () => {
        toSingle(
          received,
          await received.evaluateAll((elements) => elements.map(() => null)),
        );
        const visible = await received.isVisible();
        return {
          actual: visible ? 'visible' : 'hidden',
          pass: visible,
        };
      },
      this.isNot,
      options.timeout ?? EXPECT_TIMEOUT,
      LOCATOR_INTERVALS,
    );
    return {
      message: () =>
        `expected ${received} ${this.isNot ? 'not ' : ''}to be visible, but it was ${actual}`,
      pass,
    };
  },
  async toHaveAttribute(
    received: unknown,
    name: string,
    value: string,
    options: PollOptions = {},
  ) {
    assertLocator(received);
    const { actual, pass } = await poll(
      async () => {
        const current = toSingle(
          received,
          await received.evaluateAll(
            (elements, attribute) =>
              elements.map((element) => element.getAttribute(attribute)),
            name,
          ),
        );
        return {
          actual: current,
          pass: current === value,
        };
      },
      this.isNot,
      options.timeout ?? EXPECT_TIMEOUT,
      LOCATOR_INTERVALS,
    );
    return {
      actual,
      expected: value,
      message: () =>
        `expected ${received} ${this.isNot ? 'not ' : ''}to have attribute ${name}=${this.utils.printExpected(value)}, received ${this.utils.printReceived(actual)}`,
      pass,
    };
  },
  async toHaveCount(
    received: unknown,
    count: number,
    options: PollOptions = {},
  ) {
    assertLocator(received);
    const { actual, pass } = await poll(
      async () => {
        const current = await received.count();
        return {
          actual: current,
          pass: current === count,
        };
      },
      this.isNot,
      options.timeout ?? EXPECT_TIMEOUT,
      LOCATOR_INTERVALS,
    );
    return {
      actual,
      expected: count,
      message: () =>
        `expected ${received} ${this.isNot ? 'not ' : ''}to have count ${this.utils.printExpected(count)}, received ${this.utils.printReceived(actual)}`,
      pass,
    };
  },
  async toHaveText(
    received: unknown,
    expected: string | string[],
    options: PollOptions = {},
  ) {
    assertLocator(received);
    const { actual, pass } = await poll(
      async () => {
        const texts = (await received.allTextContents()).map(
          normalizeWhiteSpace,
        );
        if (Array.isArray(expected)) {
          return {
            actual: texts,
            pass: this.equals(texts, expected.map(normalizeWhiteSpace)),
          };
        }
        const text = toSingle(received, texts);
        return {
          actual: text,
          pass: text === normalizeWhiteSpace(expected),
        };
      },
      this.isNot,
      options.timeout ?? EXPECT_TIMEOUT,
      LOCATOR_INTERVALS,
    );
    return {
      actual,
      expected,
      message: () =>
        `expected ${received} ${this.isNot ? 'not ' : ''}to have text ${this.utils.printExpected(expected)}, received ${this.utils.printReceived(actual)}`,
      pass,
    };
  },
  async toHaveValue(
    received: unknown,
    value: string,
    options: PollOptions = {},
  ) {
    assertLocator(received);
    const { actual, pass } = await poll(
      async () => {
        const current = toSingle(
          received,
          await received.evaluateAll((elements) =>
            elements.map((element) => {
              if (
                element instanceof HTMLInputElement ||
                element instanceof HTMLTextAreaElement ||
                element instanceof HTMLSelectElement
              ) {
                return element.value;
              }
              throw new Error('Not an input, textarea, or select element');
            }),
          ),
        );
        return {
          actual: current,
          pass: current === value,
        };
      },
      this.isNot,
      options.timeout ?? EXPECT_TIMEOUT,
      LOCATOR_INTERVALS,
    );
    return {
      actual,
      expected: value,
      message: () =>
        `expected ${received} ${this.isNot ? 'not ' : ''}to have value ${this.utils.printExpected(value)}, received ${this.utils.printReceived(actual)}`,
      pass,
    };
  },
  async toPass(received: unknown, options: PollOptions = {}) {
    if (typeof received !== 'function') {
      throw new TypeError('Expected a function');
    }
    if (this.isNot) {
      throw new Error('`toPass` does not support `.not`');
    }
    let error: unknown;
    const { pass } = await poll(
      async () => {
        try {
          await received();
          return {
            actual: undefined,
            pass: true,
          };
        } catch (caught) {
          error = caught;
          return {
            actual: caught,
            pass: false,
          };
        }
      },
      false,
      options.timeout ?? TO_PASS_TIMEOUT,
      TO_PASS_INTERVALS,
    );
    return {
      message: () =>
        `expected the callback to pass within ${options.timeout ?? TO_PASS_TIMEOUT}ms, last error: ${error instanceof Error ? error.message : String(error)}`,
      pass,
    };
  },
});

export { expect };
