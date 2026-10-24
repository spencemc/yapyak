import type { ChildProcess } from 'node:child_process';

import { EXAMPLES, IS_PROD, SANDBOX_PORT, resolvePort } from './example';
import { spawn, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

type WebServer = {
  command: string;
  env: Record<string, string>;
  name: string;
  port: number;
};

const E2E_PATH = fileURLToPath(new URL('..', import.meta.url));

const LAUNCH_TIMEOUT = 60_000;

const POLL_INTERVALS = [
  100,
  250,
  500,
];

const DEFAULT_ENV = {
  BROWSER: 'none',
  DEBUG_COLORS: '1',
  FORCE_COLOR: '1',
};

function resolveWebServers(): WebServer[] {
  const servers = EXAMPLES.map((example): WebServer => {
    const port = resolvePort(example);
    const run = `pnpm --filter @yapyak-examples/${example.name}`;
    let command = `${run} preview --port ${port}`;
    if (!IS_PROD) {
      command = `${run} dev --port ${port}`;
    } else if (example.serve === 'start') {
      command = `PORT=${port} ${run} start`;
    }
    return {
      command,
      env: {
        ASTRO_DEV_BACKGROUND: '1',
        ASTRO_PREVIEW_BACKGROUND: '1',
        TZ: 'Europe/Stockholm',
      },
      name: example.name,
      port,
    };
  });
  if (IS_PROD) {
    return servers;
  }
  return [
    ...servers,
    {
      command: `pnpm --filter @yapyak/e2e-sandbox reset && pnpm --filter @yapyak/e2e-sandbox dev --port ${SANDBOX_PORT}`,
      env: {
        TZ: 'Europe/Stockholm',
      },
      name: 'sandbox',
      port: SANDBOX_PORT,
    },
  ];
}

// Vitest sets these in its own process; servers that inherit them switch to
// test mode and turn off HMR.
function toServerEnv(server: WebServer): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...DEFAULT_ENV,
    ...process.env,
    ...server.env,
  };
  for (const key of Object.keys(env)) {
    if (key === 'TEST' || key === 'VITEST' || key.startsWith('VITEST_')) {
      delete env[key];
    }
  }
  if (env.NODE_ENV === 'test') {
    delete env.NODE_ENV;
  }
  return env;
}

function isPortUsed(port: number): Promise<boolean> {
  const probe = (host: string): Promise<boolean> =>
    new Promise((resolve) => {
      const socket = connect(port, host)
        .on('error', () => {
          resolve(false);
        })
        .on('connect', () => {
          socket.end();
          resolve(true);
        });
    });
  return Promise.all([
    probe('127.0.0.1'),
    probe('::1'),
  ]).then((results) => results.includes(true));
}

function killProcess(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('taskkill', [
      '/pid',
      String(child.pid),
      '/T',
      '/F',
    ]);
    return;
  }
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    // The process group already exited.
  }
}

async function waitForPort(server: WebServer, child: ChildProcess) {
  const exited = new Promise<never>((_, reject) => {
    child.once('exit', (code) => {
      reject(
        new Error(
          code
            ? `${server.name} web server was not able to start. Exit code: ${code}`
            : `${server.name} web server exited early.`,
        ),
      );
    });
  });
  // A server exiting after it came up surfaces through the failing tests.
  exited.catch(() => undefined);
  const ready = (async () => {
    const deadline = Date.now() + LAUNCH_TIMEOUT;
    const intervals = [
      ...POLL_INTERVALS,
    ];
    while (Date.now() < deadline) {
      if (await isPortUsed(server.port)) {
        return;
      }
      await setTimeout(intervals.shift() ?? 1000);
    }
    throw new Error(
      `Timed out waiting ${LAUNCH_TIMEOUT}ms for the ${server.name} web server on port ${server.port}.`,
    );
  })();
  await Promise.race([
    exited,
    ready,
  ]);
}

function startProcess(server: WebServer): ChildProcess {
  const child = spawn(server.command, {
    cwd: E2E_PATH,
    detached: process.platform !== 'win32',
    env: toServerEnv(server),
    shell: true,
    stdio: [
      'ignore',
      'ignore',
      'pipe',
    ],
  });
  child.stderr?.on('data', (data: Buffer) => {
    const prefixed = data
      .toString()
      .split('\n')
      .map((line) => (line === '' ? line : `[${server.name}] ${line}`))
      .join('\n');
    process.stderr.write(prefixed);
  });
  return child;
}

export async function setup(): Promise<() => void> {
  const servers = resolveWebServers();
  const used = await Promise.all(
    servers.map((server) => isPortUsed(server.port)),
  );
  const taken = servers.filter((_, index) => used[index]);
  if (taken.length > 0) {
    throw new Error(
      `${taken.map((server) => `http://localhost:${server.port}`).join(', ')} is already used, make sure that nothing is running on the port.`,
    );
  }
  const children = servers.map(startProcess);
  const teardown = (): void => {
    for (const child of children) {
      killProcess(child);
    }
  };
  try {
    await Promise.all(
      servers.map((server, index) => {
        const child = children[index];
        if (child === undefined) {
          throw new Error(`${server.name} web server did not spawn.`);
        }
        return waitForPort(server, child);
      }),
    );
  } catch (error) {
    teardown();
    throw error;
  }
  return teardown;
}
