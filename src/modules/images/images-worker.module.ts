import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ImagesProcessor } from './images.processor.js';
import { ImagesRepository } from './images.repository.js';
import { IMAGES_QUEUE } from './images.service.js';

// Worker-side consumer of the images queue (URL imports).
@Module({
  imports: [BullModule.registerQueue({ name: IMAGES_QUEUE })],
  providers: [ImagesRepository, ImagesProcessor],
})
export class ImagesWorkerModule {}
