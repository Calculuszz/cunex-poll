import { Module } from '@nestjs/common';
import { InfraModule } from './infra/infra.module.js';

// Background worker: notifications, scheduled poll closing, image import.
// Queue processors are added to `imports` as each feature lands.
@Module({
  imports: [InfraModule],
})
export class WorkerModule {}
