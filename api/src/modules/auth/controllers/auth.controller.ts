import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_MS,
} from '../constants/auth.constants.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { AuthService } from '../services/auth.service.js';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setSessionCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }

  @Get('google')
  redirectToGoogle(@Res() res: Response) {
    const frontendUrl = this.authService.getFrontendUrl();
    const redirectInfo = this.authService.createGoogleAuthRedirect();

    if (!redirectInfo) {
      res.redirect(`${frontendUrl}/login?error=google_not_configured`);
      return;
    }

    res.cookie(OAUTH_STATE_COOKIE_NAME, redirectInfo.state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: OAUTH_STATE_MAX_AGE_MS,
      path: '/',
    });

    res.redirect(redirectInfo.url);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = this.authService.getFrontendUrl();
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE_NAME] as
      | string
      | undefined;
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, { path: '/' });

    if (!code || !state || !expectedState || state !== expectedState) {
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      return;
    }

    try {
      const { token } = await this.authService.handleGoogleCallback(code);
      this.setSessionCookie(res, token);
      res.redirect(`${frontendUrl}/dashboard`);
    } catch {
      res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.register(dto);
    this.setSessionCookie(res, token);
    return { user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.login(dto);
    this.setSessionCookie(res, token);
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    const user = await this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException('Chưa đăng nhập.');
    }
    return { user };
  }
}
