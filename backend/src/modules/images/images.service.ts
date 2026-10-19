import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../common/errors.js';
import type { Env } from '../../config/env.js';
import { StorageService } from '../../infra/storage/storage.service.js';
import { type ImageType, sniffImageType } from './image-type.js';

const EXTENSION: Record<ImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Keys we hand out: images/<uuid>.<ext>. Anything else in a poll is rejected.
const KEY = /^images\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export type ImageCheck = 'ok' | 'missing' | 'not_an_image';

@Injectable()
export class ImagesService {
  private readonly maxBytes: number;

  constructor(
    private readonly storage: StorageService,
    config: ConfigService<Env, true>,
  ) {
    this.maxBytes = config.get('IMAGE_MAX_BYTES');
  }

  /**
   * Hands out a one-time upload slot. The browser PUTs the file straight to
   * S3 (it never passes through the API) and puts `publicUrl` in the poll.
   */
  async startUpload(mimeType: ImageType, byteSize: number) {
    if (byteSize > this.maxBytes) {
      throw new AppError(
        'IMAGE_TOO_LARGE',
        HttpStatus.UNPROCESSABLE_ENTITY,
        `Images are limited to ${this.maxBytes} bytes`,
        { maxBytes: this.maxBytes },
      );
    }
    const key = `images/${randomUUID()}.${EXTENSION[mimeType]}`;
    return {
      uploadUrl: await this.storage.uploadUrl(key, mimeType, byteSize),
      uploadHeaders: { 'Content-Type': mimeType },
      publicUrl: this.storage.publicUrl(key),
      expiresInSeconds: 600,
    };
  }

  /** True if the URL is one we could have handed out (our bucket, our key shape). */
  isOurs(url: string): boolean {
    const key = this.storage.keyFromUrl(url);
    return !!key && KEY.test(key);
  }

  /** Was the file really uploaded, and is it really a JPEG/PNG/WebP? */
  async check(url: string): Promise<ImageCheck> {
    const key = this.storage.keyFromUrl(url);
    if (!key || !KEY.test(key)) return 'missing';
    const head = await this.storage.head(key);
    if (!head) return 'missing';
    const type = sniffImageType(await this.storage.readStart(key, 16));
    const expected = key.endsWith('.png')
      ? 'image/png'
      : key.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';
    return type === expected ? 'ok' : 'not_an_image';
  }
}
