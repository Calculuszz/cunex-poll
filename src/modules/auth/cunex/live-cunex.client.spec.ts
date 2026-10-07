import { AppError } from '../../../common/errors.js';
import { LiveCunexClient } from './live-cunex.client.js';

const client = new LiveCunexClient({
  gatewayUrl: 'https://gateway.example/lle',
  loginUrl: 'https://cunex.example/login',
  clientId: 'id-123',
  clientSecret: 'secret-456',
});

function respond(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('LiveCunexClient.getProfile', () => {
  it('calls /profile with the token and client credentials', async () => {
    const fetchMock = respond(200, {
      userId: '100000000000000001',
      studentId: '6700000021',
      facultyCode: '21',
      facultyNameTH: 'วิศวกรรมศาสตร์',
      facultyNameEN: 'Faculty of Engineering',
      studentYear: '2567',
    });

    const profile = await client.getProfile('tok en');

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      'https://gateway.example/lle/profile?token=tok+en',
    );
    expect(init.headers).toMatchObject({
      ClientId: 'id-123',
      ClientSecret: 'secret-456',
    });
    expect(profile).toEqual({
      userId: '100000000000000001',
      studentId: '6700000021',
      facultyCode: '21',
      facultyNameTh: 'วิศวกรรมศาสตร์',
      facultyNameEn: 'Faculty of Engineering',
      studentYear: 2567,
    });
  });

  it('maps E002 (token expired) to CUNEX_TOKEN_INVALID', async () => {
    respond(417, { errorCode: 'E002', message: 'token expired' });
    await expect(client.getProfile('t')).rejects.toMatchObject({
      code: 'CUNEX_TOKEN_INVALID',
    });
  });

  it('treats other failures as CUNEX being unavailable', async () => {
    respond(417, { errorCode: 'E099', message: 'internal server error' });
    await expect(client.getProfile('t')).rejects.toMatchObject({
      code: 'CUNEX_UNAVAILABLE',
    });

    respond(200, { userId: 'x' });
    await expect(client.getProfile('t')).rejects.toBeInstanceOf(AppError);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));
    await expect(client.getProfile('t')).rejects.toMatchObject({
      code: 'CUNEX_UNAVAILABLE',
    });
  });
});
