import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../common/errors.js';
import type { Env } from '../../config/env.js';
import {
  type Me,
  type User,
  UsersRepository,
} from '../users/users.repository.js';
import { CurrentUser, Public } from './auth.decorators.js';
import { CunexClient, type CunexProfile } from '../cunex/cunex.client.js';
import { MOCK_CUNEX_USERS } from '../cunex/mock-cunex.client.js';
import { safeReturnTo } from './return-to.js';
import { SESSION_COOKIE, SessionService } from './session.service.js';

// Remembers returnTo across the round trip through the CUNEX login page.
const RETURN_TO_COOKIE = 'return_to';

const loginQuery = z.object({
  returnTo: z.string().optional(),
  mockUser: z.string().optional(),
});

const callbackQuery = z.object({
  token: z.string().max(256).optional(),
  returnTo: z.string().optional(),
});

const devLoginBody = z.object({ role: z.enum(['user', 'admin']) });

@Controller()
export class AuthController {
  private readonly appOrigin: string;
  private readonly bootstrapAdmins: Set<string>;
  private readonly isProduction: boolean;

  constructor(
    private readonly cunex: CunexClient,
    private readonly sessions: SessionService,
    private readonly users: UsersRepository,
    config: ConfigService<Env, true>,
  ) {
    this.appOrigin = new URL(config.get('APP_ORIGIN')).origin;
    this.bootstrapAdmins = new Set(config.get('ADMIN_BOOTSTRAP_CUNEX_IDS'));
    this.isProduction = config.get('APP_ENV') === 'production';
  }

  @Public()
  @Get('auth/cunex/login')
  cunexLogin(
    @Query({ schema: loginQuery }) query: z.infer<typeof loginQuery>,
    @Res() res: Response,
  ) {
    res.cookie(RETURN_TO_COOKIE, safeReturnTo(query.returnTo), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });
    res.redirect(302, this.cunex.loginUrl({ mockUser: query.mockUser }));
  }

  // CUNEX opens this URL with ?token= from its menu, notifications, shared
  // links and "login with CUNEX". It is a browser navigation, so failures go
  // back to the web app's login page instead of returning JSON.
  @Public()
  @Get('auth/cunex/callback')
  async cunexCallback(
    @Query({ schema: callbackQuery }) query: z.infer<typeof callbackQuery>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const returnTo = safeReturnTo(
      query.returnTo ?? (req.cookies?.[RETURN_TO_COOKIE] as unknown),
    );
    res.clearCookie(RETURN_TO_COOKIE, { path: '/' });

    let profile: CunexProfile;
    try {
      if (!query.token) throw new AppError('CUNEX_TOKEN_INVALID', 401);
      profile = await this.cunex.getProfile(query.token);
    } catch (err) {
      const reason =
        err instanceof AppError && err.code === 'CUNEX_TOKEN_INVALID'
          ? 'token_expired'
          : 'cunex_unavailable';
      return res.redirect(302, `${this.appOrigin}/login?error=${reason}`);
    }

    const user = await this.users.upsertFromCunex(
      profile,
      this.bootstrapAdmins.has(profile.userId),
    );
    await this.startSession(res, user);
    res.redirect(302, `${this.appOrigin}${returnTo}`);
  }

  /** "เลือกบัญชีทดลอง" popup: log in as a fixture user. Never in production. */
  @Public()
  @Post('auth/dev/login')
  async devLogin(
    @Body({ schema: devLoginBody }) body: z.infer<typeof devLoginBody>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Me> {
    if (this.isProduction) {
      throw new AppError('NOT_FOUND', HttpStatus.NOT_FOUND, 'Not found');
    }
    const fixture =
      body.role === 'admin'
        ? MOCK_CUNEX_USERS.admin
        : MOCK_CUNEX_USERS['eng-2567'];
    const user = await this.users.upsertFromCunex(
      fixture,
      body.role === 'admin',
    );
    await this.startSession(res, user);
    return this.getMe(user);
  }

  @Public()
  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.sessions.destroy(req.cookies?.[SESSION_COOKIE] as string);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  @Get('me')
  me(@CurrentUser() user: User): Promise<Me> {
    return this.getMe(user);
  }

  private async startSession(res: Response, user: User) {
    const sid = await this.sessions.create(user.id);
    res.cookie(SESSION_COOKIE, sid, this.sessions.cookieOptions());
  }

  private async getMe(user: User): Promise<Me> {
    const me = await this.users.getMe(user.id);
    if (!me) throw new AppError('UNAUTHENTICATED', HttpStatus.UNAUTHORIZED);
    return me;
  }
}
