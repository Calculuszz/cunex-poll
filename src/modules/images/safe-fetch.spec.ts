import { sniffImageType } from './image-type.js';
import {
  checkUrl,
  isPublicAddress,
  safeDownload,
  UnsafeUrlError,
} from './safe-fetch.js';

describe('isPublicAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.20.0.1',
    '192.168.1.1',
    '169.254.169.254', // cloud metadata
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    'fd00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
  ])('blocks %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });

  it.each(['8.8.8.8', '161.200.1.1', '2001:4860:4860::8888'])(
    'allows %s',
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    },
  );
});

describe('checkUrl', () => {
  it.each([
    'http://example.com/a.png',
    'https://example.com:8443/a.png',
    'https://user:pw@example.com/a.png',
    'https://127.0.0.1/a.png',
    'https://[::1]/a.png',
    'file:///etc/passwd',
    'not a url',
  ])('rejects %s', (u) => {
    expect(() => checkUrl(u)).toThrow(UnsafeUrlError);
  });

  it('accepts a plain https URL', () => {
    expect(checkUrl('https://example.com/a.png').hostname).toBe('example.com');
  });
});

describe('safeDownload', () => {
  it('refuses hostnames that resolve to a private address', async () => {
    await expect(
      safeDownload('https://localhost/a.png', 1000),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});

describe('sniffImageType', () => {
  it('reads signatures, not names', () => {
    expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      'image/jpeg',
    );
    expect(
      sniffImageType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe('image/png');
    expect(sniffImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe(
      'image/webp',
    );
    expect(sniffImageType(Buffer.from('<svg xmlns=...'))).toBeUndefined();
  });
});
