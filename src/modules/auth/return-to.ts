/**
 * Where to send the browser after login. Only same-site relative paths are
 * allowed, so the callback can't be turned into an open redirect
 * (e.g. `//evil.com` or `/\evil.com`, which browsers treat as another host).
 */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 512) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (ch === '\\' || code < 0x20 || code === 0x7f) return '/';
  }
  return value;
}
