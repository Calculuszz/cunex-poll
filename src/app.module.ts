import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { OriginGuard } from './common/origin.guard.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { InfraModule } from './infra/infra.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [InfraModule, AuthModule, HealthModule],
  providers: [
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
    { provide: APP_GUARD, useClass: OriginGuard },
  ],
})
export class AppModule {}
