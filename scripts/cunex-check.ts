// Checks the live CUNEX /profile call with a real token.
// Usage: pnpm cunex:check <token>   (reads CUNEX_GATEWAY_URL / CLIENT_ID / CLIENT_SECRET from .env)
// Get a token from CUNEX "ห้องทดลอง" (lab) — the page shows it after you open the app.
import { LiveCunexClient } from '../src/modules/auth/cunex/live-cunex.client.js';

const token = process.argv[2];
const { CUNEX_GATEWAY_URL, CUNEX_CLIENT_ID, CUNEX_CLIENT_SECRET } = process.env;
if (!token || !CUNEX_GATEWAY_URL || !CUNEX_CLIENT_ID || !CUNEX_CLIENT_SECRET) {
  console.error(
    'usage: pnpm cunex:check <token>  (needs CUNEX_GATEWAY_URL, CUNEX_CLIENT_ID, CUNEX_CLIENT_SECRET in .env)',
  );
  process.exit(2);
}

const url = new URL('profile', `${CUNEX_GATEWAY_URL.replace(/\/$/, '')}/`);
console.log(`GET ${url.href}?token=<${token.length} chars>`);

// Raw call first, so an unexpected status/body is visible as-is.
url.searchParams.set('token', token);
const res = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    ClientId: CUNEX_CLIENT_ID,
    ClientSecret: CUNEX_CLIENT_SECRET,
  },
  signal: AbortSignal.timeout(30_000),
});
const body = await res.text();
console.log(`HTTP ${res.status}`);
console.log(body || '(empty body)');

if (res.ok) {
  // Same parsing the app uses at login.
  const profile = await new LiveCunexClient({
    gatewayUrl: CUNEX_GATEWAY_URL,
    loginUrl: 'unused',
    clientId: CUNEX_CLIENT_ID,
    clientSecret: CUNEX_CLIENT_SECRET,
  }).getProfile(token);
  console.log('\nparsed by the app:', profile);
}
