import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
} from '../constants/auth.constants.js';
import { LoginDto } from '../dto/login.dto.js';
import { RegisterDto } from '../dto/register.dto.js';
import { GoogleAuthDto } from '../dto/google-auth.dto.js';
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

  @Get('google-config')
  getGoogleConfig() {
    return this.authService.getGoogleClientConfig();
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

  @Post('google')
  async googleLogin(
    @Body() dto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.authService.authenticateGoogle(dto);
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
