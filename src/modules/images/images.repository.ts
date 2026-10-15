import { Inject, Injectable } from '@nestjs/common';
import type { Selectable } from 'kysely';
import { Database } from '../../infra/database/database.js';
import type { Images } from '../../infra/database/db.js';

export type ImageRow = Selectable<Images>;

@Injectable()
export class ImagesRepository {
  constructor(@Inject(Database) private readonly db: Database) {}

  create(values: {
    ownerId: string;
    storageKey: string;
    mimeType?: string;
    byteSize?: number;
    sourceUrl?: string;
  }) {
    return this.db
      .insertInto('images')
      .values({ ...values, status: 'pending' })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  find(id: string) {
    return this.db
      .selectFrom('images')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /** Only moves out of `pending`, so a finished image is never overwritten. */
  async finish(
    id: string,
    result:
      | { status: 'ready'; mimeType: string; byteSize: number }
      | { status: 'failed' },
  ) {
    await this.db
      .updateTable('images')
      .set(result)
      .where('id', '=', id)
      .where('status', '=', 'pending')
      .execute();
  }

  readyKeys(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([]);
    return this.db
      .selectFrom('images')
      .select(['id', 'storageKey'])
      .where('id', 'in', ids)
      .where('status', '=', 'ready')
      .execute();
  }
}
