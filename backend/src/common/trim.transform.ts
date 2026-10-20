import { Transform } from 'class-transformer';

/** Removes spaces around a string field before it gets validated ("  Ana " -> "Ana"). */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
