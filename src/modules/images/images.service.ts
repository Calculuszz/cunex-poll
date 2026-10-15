import { randomUUID } from 'node:crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { AppError } from '../../common/errors.js';
import type { Env } from '../../config/env.js';
import { StorageService } from '../../infra/storage/storage.service.js';
import type { User } from '../users/users.repository.js';
import { type ImageType, sniffImageType } from './image-type.js';
import { type ImageRow, ImagesRepository } from './images.repository.js';
import { checkUrl, UnsafeUrlError } from './safe-fetch.js';

export const IMAGES_QUEUE = 'images';

const notFound = () =>
  new AppError('IMAGE_NOT_FOUND', HttpStatus.NOT_FOUND, 'Image not found');

@Injectable()
export class ImagesService {
  private readonly maxBytes: number;

  constructor(
    private readonly repo: ImagesRepository,
    private readonly storage: StorageService,
    @InjectQueue(IMAGES_QUEUE) private readonly queue: Queue,
    config: ConfigService<Env, true>,
  ) {
    this.maxBytes = config.get('IMAGE_MAX_BYTES');
  }

  /** Step 1 of an upload: reserve an id and hand out a presigned PUT. */
  async startUpload(user: User, mimeType: ImageType, byteSize: number) {
    if (byteSize > this.maxBytes) {
      throw new AppError(
        'IMAGE_TOO_LARGE',
        HttpStatus.UNPROCESSABLE_ENTITY,
        `Images are limited to ${this.maxBytes} bytes`,
        { maxBytes: this.maxBytes },
      );
    }
    const image = await this.repo.create({
      ownerId: user.id,
      storageKey: `images/${randomUUID()}`,
      mimeType,
      byteSize,
    });
    return {
      imageId: image.id,
      upload: {
        method: 'PUT' as const,
        url: await this.storage.uploadUrl(
          image.storageKey!,
          mimeType,
          byteSize,
        ),
        headers: { 'Content-Type': mimeType },
      },
    };
  }

  /**
   * Step 2: the client says the upload finished. We check the stored object
   * ourselves: right size, and its first bytes really are the declared type.
   */
  async completeUpload(user: User, id: string) {
    const image = await this.owned(user, id);
    if (image.status === 'ready') return this.view(image);
    if (image.status === 'failed' || image.sourceUrl) {
      throw invalidFile('This upload can no longer be completed');
    }

    const head = await this.storage.head(image.storageKey!);
    if (!head) {
      throw new AppError(
        'UPLOAD_NOT_FOUND',
        HttpStatus.CONFLICT,
        'Nothing was uploaded yet',
      );
    }
    const sniffed = sniffImageType(
      await this.storage.readStart(image.storageKey!, 16),
    );
    if (head.size !== image.byteSize || sniffed !== image.mimeType) {
      await this.repo.finish(id, { status: 'failed' });
      throw invalidFile('The file is not the declared image');
    }
    await this.repo.finish(id, {
      status: 'ready',
      mimeType: sniffed,
      byteSize: head.size,
    });
    return this.view((await this.repo.find(id))!);
  }

  /** Import from a URL. The worker downloads it; poll GET /images/:id. */
  async startImport(user: User, url: string) {
    try {
      checkUrl(url);
    } catch (err) {
      if (err instanceof UnsafeUrlError) {
        throw new AppError(
          'INVALID_URL',
          HttpStatus.UNPROCESSABLE_ENTITY,
          `URL not allowed: ${err.message}`,
        );
      }
      throw err;
    }
    const image = await this.repo.create({
      ownerId: user.id,
      storageKey: `images/${randomUUID()}`,
      sourceUrl: url,
    });
    await this.queue.add(
      'import-image',
      { imageId: image.id },
      { jobId: `import-${image.id}`, attempts: 3 },
    );
    return { imageId: image.id, status: image.status };
  }

  async get(user: User, id: string) {
    return this.view(await this.owned(user, id));
  }

  private async owned(user: User, id: string) {
    const image = await this.repo.find(id);
    if (!image || image.ownerId !== user.id) throw notFound();
    return image;
  }

  private async view(image: ImageRow) {
    return {
      id: image.id,
      status: image.status,
      mimeType: image.mimeType,
      byteSize: image.byteSize,
      url:
        image.status === 'ready'
          ? await this.storage.readUrl(image.storageKey!)
          : null,
    };
  }
}

function invalidFile(detail: string) {
  return new AppError(
    'INVALID_IMAGE_FILE',
    HttpStatus.UNPROCESSABLE_ENTITY,
    detail,
  );
}
