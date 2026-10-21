import { beforeEach, describe, expect, it, vi } from 'vitest';

const setMock = vi.fn();
const cookieStore = { get: vi.fn(), set: setMock, delete: vi.fn() };
let headerMap: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () => ({
    get: (key: string) => headerMap[key.toLowerCase()] ?? null,
  }),
}));

vi.mock('../db/queries', () => ({
  createSession: vi.fn(),
  deleteExpiredSessions: vi.fn(),
  deleteSession: vi.fn(),
  findSession: vi.fn(),
  findUserById: vi.fn(),
}));

import { SESSION_COOKIE, startSession } from './session';

function assertCookie(options: Record<string, unknown>) {
  expect(setMock).toHaveBeenCalledTimes(1);
  const [name, token, opts] = setMock.mock.calls[0];
  expect(name).toBe(SESSION_COOKIE);
  expect(typeof token).toBe('string');
  expect(token.length).toBeGreaterThan(20);
  expect(opts).toBe(options);
}

async function run() {
  await startSession('usr_test');
  return setMock.mock.calls[0][2] as Record<string, unknown>;
}

beforeEach(() => {
  setMock.mockClear();
  headerMap = {};
  delete process.env.SESSION_COOKIE_SECURE;
});

describe('startSession cookie', () => {
  it('persists the cookie with path=/ and httpOnly over plain HTTP (not Secure)', async () => {
    const options = await run();
    assertCookie(options);
    expect(options.secure).toBe(false);
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe('/');
    expect(options.sameSite).toBe('lax');
    expect(options.maxAge).toBeGreaterThan(0);
    expect(options.expires).toBeInstanceOf(Date);
  });

  it('marks the cookie Secure when the request arrived over HTTPS', async () => {
    headerMap = { 'x-forwarded-proto': 'https' };
    const options = await run();
    expect(options.secure).toBe(true);
  });

  it('honours the SESSION_COOKIE_SECURE override', async () => {
    process.env.SESSION_COOKIE_SECURE = 'true';
    const options = await run();
    expect(options.secure).toBe(true);
  });
});
