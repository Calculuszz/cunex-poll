import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller.js';
import { ImagesRepository } from './images.repository.js';
import { IMAGES_QUEUE, ImagesService } from './images.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: IMAGES_QUEUE })],
  controllers: [ImagesController],
  providers: [ImagesRepository, ImagesService],
  exports: [ImagesRepository],
})
export class ImagesModule {}
