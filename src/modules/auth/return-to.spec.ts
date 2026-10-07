import { safeReturnTo } from './return-to.js';

describe('safeReturnTo', () => {
  it('keeps same-site paths', () => {
    expect(safeReturnTo('/polls/123?tab=results')).toBe(
      '/polls/123?tab=results',
    );
  });

  it.each([
    ['protocol-relative URL', '//evil.com'],
    ['backslash trick', '/\\evil.com'],
    ['absolute URL', 'https://evil.com'],
    ['newline injection', '/ok\r\nSet-Cookie: x'],
    ['not a string', 42],
    ['missing', undefined],
  ])('falls back to / for %s', (_, value) => {
    expect(safeReturnTo(value)).toBe('/');
  });

  it('rejects very long values', () => {
    expect(safeReturnTo(`/${'a'.repeat(600)}`)).toBe('/');
  });
});
