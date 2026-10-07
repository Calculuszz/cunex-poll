import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.js';
import { InfraModule } from './infra/infra.module.js';

// Background worker: notifications, scheduled poll closing, image import.
// Queue processors are added to `imports` as each feature lands.
@Module({
  imports: [
    InfraModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: { url: config.get('REDIS_URL') },
      }),
    }),
  ],
})
export class WorkerModule {}
