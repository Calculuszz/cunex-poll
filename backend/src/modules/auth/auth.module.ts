import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CunexModule } from '../cunex/cunex.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { SessionService } from './session.service.js';

@Module({
  imports: [UsersModule, CunexModule],
  controllers: [AuthController],
  providers: [SessionService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
