import { lookup } from 'node:dns';
import { get } from 'node:https';
import { BlockList, isIP } from 'node:net';

/**
 * Downloads a user-supplied image URL without letting it reach our own
 * network (SSRF): https only, port 443, every resolved address checked
 * against private/reserved ranges at connect time (so DNS rebinding can't
 * swap in an internal IP after a check), at most 3 redirects, size and time
 * capped.
 */

const blocked = new BlockList();
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(net, prefix, 'ipv4');
}
for (const [net, prefix] of [
  // IPv4-mapped (::ffff:a.b.c.d) is unwrapped and checked as IPv4 in
  // isPublicAddress; a ::ffff:0:0/96 rule here would also match every IPv4.
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(net, prefix, 'ipv6');
}

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !blocked.check(ip, 'ipv4');
  if (family === 6) {
    const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicAddress(mapped[1]!);
    return !blocked.check(ip, 'ipv6');
  }
  return false;
}

export class UnsafeUrlError extends Error {}

export function checkUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('not a URL');
  }
  if (url.protocol !== 'https:') throw new UnsafeUrlError('https only');
  if (url.port && url.port !== '443') throw new UnsafeUrlError('port 443 only');
  if (url.username || url.password) throw new UnsafeUrlError('no credentials');
  if (
    isIP(url.hostname.replace(/^\[|\]$/g, '')) &&
    !isPublicAddress(url.hostname.replace(/^\[|\]$/g, ''))
  ) {
    throw new UnsafeUrlError('private address');
  }
  return url;
}

// Resolves like dns.lookup but refuses to hand back a private address.
const safeLookup: typeof lookup = ((
  hostname: string,
  options: object,
  callback: (
    err: Error | null,
    address: string | object[],
    family?: number,
  ) => void,
) => {
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, '');
    const list = addresses as { address: string; family: number }[];
    if (list.length === 0 || list.some((a) => !isPublicAddress(a.address))) {
      return callback(new UnsafeUrlError('private address'), '');
    }
    if ((options as { all?: boolean }).all) return callback(null, list);
    callback(null, list[0]!.address, list[0]!.family);
  });
}) as typeof lookup;

export interface Downloaded {
  body: Buffer;
  contentType: string;
}

export async function safeDownload(
  raw: string,
  maxBytes: number,
  redirectsLeft = 3,
): Promise<Downloaded> {
  const url = checkUrl(raw);
  return new Promise<Downloaded>((resolve, reject) => {
    const req = get(
      url,
      { lookup: safeLookup, timeout: 10_000, headers: { accept: 'image/*' } },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft === 0) {
            reject(new UnsafeUrlError('too many redirects'));
            return;
          }
          const next = new URL(res.headers.location, url).toString();
          safeDownload(next, maxBytes, redirectsLeft - 1).then(resolve, reject);
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(new Error(`download failed with HTTP ${status}`));
          return;
        }
        const declared = Number(res.headers['content-length'] ?? 0);
        if (declared > maxBytes) {
          res.destroy();
          reject(new UnsafeUrlError('file too large'));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (c: Buffer) => {
          size += c.length;
          if (size > maxBytes) {
            res.destroy();
            reject(new UnsafeUrlError('file too large'));
            return;
          }
          chunks.push(c);
        });
        res.on('end', () =>
          resolve({
            body: Buffer.concat(chunks),
            contentType: String(res.headers['content-type'] ?? ''),
          }),
        );
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error('download timed out')));
    req.on('error', reject);
  });
}
