// Applies db/migrations/*.sql in filename order, each in its own transaction.
// Used by `pnpm db:migrate` and the e2e test setup.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'db', 'migrations');
// Arbitrary constant so concurrent deploys don't migrate at the same time.
const LOCK_ID = 727_001;

export async function runMigrations(
  url: string,
  log: (line: string) => void = () => {},
): Promise<number> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     text        PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )`);

    const applied = new Set(
      (
        await client.query<{ version: string }>(
          'SELECT version FROM schema_migrations',
        )
      ).rows.map((r) => r.version),
    );
    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`, {
          cause: err,
        });
      }
      log(`applied ${file}`);
      count++;
    }
    return count;
  } finally {
    await client
      .query('SELECT pg_advisory_unlock($1)', [LOCK_ID])
      .catch(() => {});
    await client.end();
  }
}
