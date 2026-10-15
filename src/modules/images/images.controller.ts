import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { RateLimiter } from '../../common/rate-limiter.js';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { User } from '../users/users.repository.js';
import { IMAGE_TYPES } from './image-type.js';
import { ImagesService } from './images.service.js';

const imageId = z.uuid();
const uploadBody = z.object({
  mimeType: z.enum(IMAGE_TYPES),
  byteSize: z.int().positive(),
});
const importBody = z.object({ url: z.string().max(2000) });

@Controller('images')
export class ImagesController {
  constructor(
    private readonly images: ImagesService,
    private readonly limiter: RateLimiter,
  ) {}

  @Post('uploads')
  async upload(
    @CurrentUser() user: User,
    @Body({ schema: uploadBody }) body: z.infer<typeof uploadBody>,
  ) {
    await this.limiter.hit(`image-upload:${user.id}`, 30, 60);
    return this.images.startUpload(user, body.mimeType, body.byteSize);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentUser() user: User,
    @Param('id', { schema: imageId }) id: string,
  ) {
    return this.images.completeUpload(user, id);
  }

  @Post('import')
  @HttpCode(HttpStatus.ACCEPTED)
  async import(
    @CurrentUser() user: User,
    @Body({ schema: importBody }) body: z.infer<typeof importBody>,
  ) {
    await this.limiter.hit(`image-import:${user.id}`, 10, 60);
    return this.images.startImport(user, body.url);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id', { schema: imageId }) id: string) {
    return this.images.get(user, id);
  }
}
