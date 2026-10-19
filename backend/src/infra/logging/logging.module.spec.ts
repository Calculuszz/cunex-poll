import { redactUrl } from './logging.module.js';

describe('redactUrl', () => {
  it('hides the CUNEX token but keeps other params', () => {
    expect(
      redactUrl('/api/v1/auth/cunex/callback?token=abc123&returnTo=%2Fpolls'),
    ).toBe(
      '/api/v1/auth/cunex/callback?token=%5BREDACTED%5D&returnTo=%2Fpolls',
    );
  });

  it('leaves URLs without secrets alone', () => {
    expect(redactUrl('/api/v1/polls?cursor=x')).toBe('/api/v1/polls?cursor=x');
    expect(redactUrl('/healthz')).toBe('/healthz');
  });
});
