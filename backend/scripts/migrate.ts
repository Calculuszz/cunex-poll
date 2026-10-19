// Usage: pnpm db:migrate   (reads DATABASE_URL)
import { runMigrations } from './migrator.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const count = await runMigrations(url, console.log);
console.log(count ? `done, ${count} migration(s) applied` : 'up to date');
