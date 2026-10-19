import { HttpException, HttpStatus } from '@nestjs/common';

// Domain error rendered as RFC 9457 problem details. `code` is the stable,
// machine-readable id clients switch on (see docs/api-endpoints.md).
export class AppError extends HttpException {
  constructor(
    readonly code: string,
    status: HttpStatus,
    detail?: string,
    readonly extra?: Record<string, unknown>,
  ) {
    super(detail ?? code, status);
  }
}
