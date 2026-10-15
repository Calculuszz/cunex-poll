import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';

const UPLOAD_URL_SECONDS = 10 * 60;

/**
 * S3-compatible object storage (AWS S3, GCS interop, on-prem S3, or
 * SeaweedFS in local dev). Objects are served straight from the bucket, which
 * must allow public reads; S3_PUBLIC_BASE_URL can point at a CDN later.
 */
@Injectable()
export class StorageService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  /** Prefix of every public object URL, without a trailing slash. */
  readonly publicBase: string;
  private readonly createBucket: boolean;

  constructor(config: ConfigService<Env, true>) {
    this.bucket = config.get('S3_BUCKET');
    // `||` not `??`: for an optional key left blank in .env, ConfigService
    // falls back to the raw '' in process.env instead of the validated undefined.
    const endpoint = config.get('S3_ENDPOINT')?.replace(/\/$/, '') || undefined;
    const region = config.get('S3_REGION');
    this.publicBase = (
      config.get('S3_PUBLIC_BASE_URL') ||
      (endpoint
        ? `${endpoint}/${this.bucket}`
        : `https://${this.bucket}.s3.${region}.amazonaws.com`)
    ).replace(/\/$/, '');
    this.createBucket = ['development', 'test'].includes(config.get('APP_ENV'));
    this.s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE'),
      // Otherwise the SDK bakes a CRC32 of the *empty* body into presigned
      // PUT URLs (the file isn't known at signing time) and every browser
      // upload fails with BadDigest.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY_ID'),
        secretAccessKey: config.get('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  /** Local dev/test convenience; production buckets are provisioned upfront. */
  async onModuleInit() {
    if (!this.createBucket) return;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (err) {
        this.logger.warn(
          `could not create bucket ${this.bucket}: ${(err as Error).message}`,
        );
      }
    }
  }

  onApplicationShutdown() {
    this.s3.destroy();
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  /** The object key if `url` points into our bucket, otherwise undefined. */
  keyFromUrl(url: string): string | undefined {
    const prefix = `${this.publicBase}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : undefined;
  }

  /**
   * Presigned PUT that only accepts exactly this Content-Type and size, so a
   * client can't swap in a bigger or different file than it declared.
   */
  uploadUrl(key: string, contentType: string, byteSize: number) {
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: byteSize,
      }),
      {
        expiresIn: UPLOAD_URL_SECONDS,
        signableHeaders: new Set(['content-type', 'content-length']),
      },
    );
  }

  async head(key: string) {
    try {
      const h = await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { size: h.ContentLength ?? 0, contentType: h.ContentType ?? '' };
    } catch {
      return undefined;
    }
  }

  /** First bytes of an object, for checking the file signature. */
  async readStart(key: string, bytes: number): Promise<Buffer> {
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Range: `bytes=0-${bytes - 1}`,
      }),
    );
    return Buffer.from(await res.Body!.transformToByteArray());
  }
}
