import type { IncomingMessage } from 'node:http';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import type { Env } from '../../config/env.js';

// Query params that must never reach logs: CUNEX passes its login token as `?token=`.
const SECRET_QUERY_PARAMS = ['token', 'code', 'state'];

export function redactUrl(url: string): string {
  const q = url.indexOf('?');
  if (q === -1) return url;
  const params = new URLSearchParams(url.slice(q + 1));
  for (const key of SECRET_QUERY_PARAMS) {
    if (params.has(key)) params.set(key, '[REDACTED]');
  }
  return `${url.slice(0, q)}?${params.toString()}`;
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          transport:
            config.get('APP_ENV') === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          redact: [
            'req.headers.cookie',
            'req.headers.authorization',
            'res.headers["set-cookie"]',
          ],
          serializers: {
            req: (req: IncomingMessage & { id?: unknown }) => ({
              id: req.id,
              method: req.method,
              url: redactUrl(req.url ?? ''),
            }),
          },
          // Health probes run every few seconds; logging them is noise.
          autoLogging: {
            ignore: (req) => req.url === '/healthz' || req.url === '/readyz',
          },
        },
      }),
    }),
  ],
})
export class LoggingModule {}
