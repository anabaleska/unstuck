import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

/**
 * The only place that talks to PostgreSQL.
 *
 * A Pool keeps a few open connections and reuses them, which is much faster
 * than opening a new connection for every request.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
    }
    this.pool = new Pool({ connectionString, max: 5 });
  }

  /** Runs one SQL statement. Always pass user input as $1, $2... params (prevents SQL injection). */
  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.pool.query<T>(sql, params);
    return result.rows;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
