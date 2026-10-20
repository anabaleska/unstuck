/**
 * Tiny migration runner.
 *
 * Runs every .sql file in db/migrations (sorted by name) that hasn't been run yet,
 * and remembers which ones ran in a `schema_migrations` table.
 *
 * Usage: npm run db:migrate   (uses DATABASE_URL from .env)
 */
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const MIGRATIONS_DIR = join(__dirname, '..', 'db', 'migrations');

export async function runMigrations(connectionString: string): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name   TEXT PRIMARY KEY,
        run_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const alreadyRun = new Set(rows.map((row) => row.name));

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (alreadyRun.has(file)) continue;

      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');

      // Each migration runs in a transaction: it either fully applies or not at all.
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✔ ran ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(error as Error).message}`);
      }
    }
  } finally {
    await client.end();
  }
}

// Only run automatically when called from the command line (not when imported by tests).
if (require.main === module) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }
  runMigrations(url)
    .then(() => console.log('Database is up to date.'))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
