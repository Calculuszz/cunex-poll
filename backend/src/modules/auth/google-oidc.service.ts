import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as oidc from 'openid-client';
import { AppError } from '../../common/errors.js';
import type { Env } from '../../config/env.js';

const FLOW_SECONDS = 10 * 60;

interface PendingLogin {
  verifier: string;
  nonce: string;
  returnTo: string;
}

export interface GoogleIdentity {
  sub: string;
  email: string | null;
}

/**
 * "Login with Google" via OpenID Connect: authorization code + PKCE, with
 * state and nonce kept server-side in Redis for 10 minutes. Disabled (503)
 * until GOOGLE_CLIENT_ID/SECRET are set.
 */
@Injectable()
export class GoogleOidcService {
  private readonly logger = new Logger(GoogleOidcService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly issuer: URL;
  private readonly allowHttpIssuer: boolean;
  readonly redirectUri: string;
  private config?: Promise<oidc.Configuration>;

  constructor(
    @Inject(Redis) private readonly redis: Redis,
    config: ConfigService<Env, true>,
  ) {
    this.clientId = config.get('GOOGLE_CLIENT_ID');
    this.clientSecret = config.get('GOOGLE_CLIENT_SECRET');
    this.issuer = new URL(config.get('GOOGLE_ISSUER_URL'));
    // Only a local test issuer may be plain http.
    this.allowHttpIssuer =
      ['development', 'test'].includes(config.get('APP_ENV')) &&
      this.issuer.protocol === 'http:';
    this.redirectUri = `${config.get('API_PUBLIC_URL').replace(/\/$/, '')}/api/v1/auth/google/callback`;
  }

  get enabled() {
    return !!this.clientId && !!this.clientSecret;
  }

  /** URL of Google's consent screen for a new login attempt. */
  async start(returnTo: string): Promise<string> {
    const config = await this.discover();
    const verifier = oidc.randomPKCECodeVerifier();
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const pending: PendingLogin = { verifier, nonce, returnTo };
    await this.redis.set(
      `oidc:${state}`,
      JSON.stringify(pending),
      'EX',
      FLOW_SECONDS,
    );
    return oidc
      .buildAuthorizationUrl(config, {
        redirect_uri: this.redirectUri,
        scope: 'openid email',
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
        code_challenge_method: 'S256',
        state,
        nonce,
        prompt: 'select_account',
      })
      .toString();
  }

  /**
   * Completes the login from the callback URL. The state is single-use:
   * it is deleted before the code exchange, so a replayed callback fails.
   */
  async finish(
    callbackUrl: URL,
  ): Promise<{ identity: GoogleIdentity; returnTo: string }> {
    const state = callbackUrl.searchParams.get('state');
    const raw = state ? await this.redis.getdel(`oidc:${state}`) : null;
    if (!raw) throw new Error('unknown or expired login state');
    const pending = JSON.parse(raw) as PendingLogin;

    const tokens = await oidc.authorizationCodeGrant(
      await this.discover(),
      callbackUrl,
      {
        pkceCodeVerifier: pending.verifier,
        expectedState: state!,
        expectedNonce: pending.nonce,
        idTokenExpected: true,
      },
    );
    const claims = tokens.claims();
    if (!claims?.sub) throw new Error('id_token without sub');
    const email =
      typeof claims.email === 'string' && claims.email_verified === true
        ? claims.email.toLowerCase()
        : null;
    return { identity: { sub: claims.sub, email }, returnTo: pending.returnTo };
  }

  private discover(): Promise<oidc.Configuration> {
    if (!this.enabled) {
      throw new AppError(
        'GOOGLE_DISABLED',
        HttpStatus.SERVICE_UNAVAILABLE,
        'Google login is not configured',
      );
    }
    this.config ??= oidc
      .discovery(this.issuer, this.clientId, this.clientSecret, undefined, {
        execute: this.allowHttpIssuer ? [oidc.allowInsecureRequests] : [],
      })
      .catch((err: unknown) => {
        this.config = undefined; // retry discovery on the next login
        this.logger.error(
          `Google OIDC discovery failed: ${(err as Error).message}`,
        );
        throw err;
      });
    return this.config;
  }
}
