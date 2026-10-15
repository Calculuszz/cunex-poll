import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { Env } from '../../config/env.js';
import { StorageService } from '../../infra/storage/storage.service.js';
import { sniffImageType } from './image-type.js';
import { ImagesRepository } from './images.repository.js';
import { IMAGES_QUEUE } from './images.service.js';
import { safeDownload, UnsafeUrlError } from './safe-fetch.js';

/**
 * Downloads images given by URL into our storage, so polls never hotlink:
 * a third-party server would otherwise see who opens which poll.
 */
@Processor(IMAGES_QUEUE)
export class ImagesProcessor extends WorkerHost {
  private readonly logger = new Logger(ImagesProcessor.name);
  private readonly maxBytes: number;

  constructor(
    private readonly repo: ImagesRepository,
    private readonly storage: StorageService,
    config: ConfigService<Env, true>,
  ) {
    super();
    this.maxBytes = config.get('IMAGE_MAX_BYTES');
  }

  async process(job: Job<{ imageId: string }>) {
    const image = await this.repo.find(job.data.imageId);
    if (!image || image.status !== 'pending' || !image.sourceUrl) {
      return { skipped: true };
    }

    try {
      const { body } = await safeDownload(image.sourceUrl, this.maxBytes);
      const type = sniffImageType(body.subarray(0, 16));
      if (!type) throw new UnsafeUrlError('not a JPEG, PNG or WebP image');
      await this.storage.put(image.storageKey!, body, type);
      await this.repo.finish(image.id, {
        status: 'ready',
        mimeType: type,
        byteSize: body.length,
      });
      return { status: 'ready' };
    } catch (err) {
      const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      // Disallowed URLs and non-images won't get better with retries.
      if (err instanceof UnsafeUrlError || lastAttempt) {
        this.logger.warn(
          `image ${image.id} import failed: ${(err as Error).message}`,
        );
        await this.repo.finish(image.id, { status: 'failed' });
        return { status: 'failed' };
      }
      throw err;
    }
  }
}
