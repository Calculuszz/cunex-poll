import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { RateLimiter } from '../../common/rate-limiter.js';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { User } from '../users/users.repository.js';
import { IMAGE_TYPES } from './image-type.js';
import { ImagesService } from './images.service.js';

const uploadBody = z.object({
  mimeType: z.enum(IMAGE_TYPES),
  byteSize: z.int().positive(),
});

@Controller('images')
export class ImagesController {
  constructor(
    private readonly images: ImagesService,
    private readonly limiter: RateLimiter,
  ) {}

  /** → { uploadUrl, uploadHeaders, publicUrl }. PUT the file to uploadUrl. */
  @Post('uploads')
  async upload(
    @CurrentUser() user: User,
    @Body({ schema: uploadBody }) body: z.infer<typeof uploadBody>,
  ) {
    await this.limiter.hit(`image-upload:${user.id}`, 30, 60);
    return this.images.startUpload(body.mimeType, body.byteSize);
  }
}
