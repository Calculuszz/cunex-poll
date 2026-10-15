import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { CunexClient } from './cunex.client.js';
import { LiveCunexClient } from './live-cunex.client.js';
import { MockCunexClient } from './mock-cunex.client.js';

// CUNEX LLE client for the API (login) and the worker (links, notifications).
@Module({
  providers: [
    {
      provide: CunexClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        config.get('CUNEX_MODE') === 'live'
          ? new LiveCunexClient({
              // env validation guarantees these are set in live mode
              gatewayUrl: config.get('CUNEX_GATEWAY_URL')!,
              loginUrl: config.get('CUNEX_LOGIN_URL')!,
              clientId: config.get('CUNEX_CLIENT_ID'),
              clientSecret: config.get('CUNEX_CLIENT_SECRET'),
            })
          : new MockCunexClient(),
    },
  ],
  exports: [CunexClient],
})
export class CunexModule {}
