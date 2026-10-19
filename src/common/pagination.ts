import { z } from 'zod';

/** `?limit=` for list endpoints. Asking for more than `max` gets `max`, not an error. */
export const pageLimit = (max: number, fallback = 20) =>
  z.coerce
    .number()
    .int()
    .min(1)
    .default(fallback)
    .transform((n) => Math.min(n, max));
