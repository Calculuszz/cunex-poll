import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { DB } from './db.js';

// Injectable Kysely instance. Columns are snake_case in Postgres and camelCase in
// TypeScript (CamelCasePlugin + `kysely-codegen --camel-case`).
export class Database extends Kysely<DB> {}

export function createDatabase(
  connectionString: string,
  max: number,
): Database {
  return new Database({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, max }),
    }),
    // JSONB contents (element config, popups) are already camelCase: leave their keys alone.
    plugins: [new CamelCasePlugin({ maintainNestedObjectKeys: true })],
  });
}
