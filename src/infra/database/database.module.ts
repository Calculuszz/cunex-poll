import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { createDatabase, Database } from './database.js';

@Global()
@Module({
  providers: [
    {
      provide: Database,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createDatabase(
          config.get('DATABASE_URL'),
          config.get('DATABASE_POOL_MAX'),
        ),
    },
  ],
  exports: [Database],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(Database) private readonly db: Database) {}

  async onApplicationShutdown() {
    await this.db.destroy();
  }
}
