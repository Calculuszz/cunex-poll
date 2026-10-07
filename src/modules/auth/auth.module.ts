import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import type { Env } from '../../config/env.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { CunexClient } from './cunex/cunex.client.js';
import { LiveCunexClient } from './cunex/live-cunex.client.js';
import { MockCunexClient } from './cunex/mock-cunex.client.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    SessionService,
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
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [CunexClient],
})
export class AuthModule {}
