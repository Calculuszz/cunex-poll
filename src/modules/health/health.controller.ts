import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { Redis } from 'ioredis';
import { sql } from 'kysely';
import { Database } from '../../infra/database/database.js';
import { Public } from '../auth/auth.decorators.js';

@Public()
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    @Inject(Database) private readonly db: Database,
    @Inject(Redis) private readonly redis: Redis,
  ) {}

  // Liveness: the process is up. Never touches dependencies, so a DB outage
  // doesn't make the orchestrator restart every replica.
  @Get('healthz')
  live() {
    return { status: 'ok' };
  }

  // Readiness: take this replica out of the load balancer when Postgres or Redis is unreachable.
  @Get('readyz')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.probe('postgres', () => sql`SELECT 1`.execute(this.db)),
      () => this.probe('redis', () => this.redis.ping()),
    ]);
  }

  private async probe(key: string, fn: () => Promise<unknown>) {
    const check = this.indicator.check(key);
    try {
      await fn();
      return check.up();
    } catch {
      // No error text: /readyz is reachable from outside and shouldn't leak hosts/ports.
      return check.down();
    }
  }
}
