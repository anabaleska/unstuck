/**
 * PostgreSQL error codes we care about.
 * Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_UNIQUE_VIOLATION = '23505'; // e.g. a second booking for the same slot
export const PG_EXCLUSION_VIOLATION = '23P01'; // e.g. a slot overlapping another slot

export function hasPgErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === code;
}
