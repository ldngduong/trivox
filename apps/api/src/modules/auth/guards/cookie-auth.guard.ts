import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_COOKIE_NAME } from '../constants/auth.constants.js';
import { AuthService } from '../services/auth.service.js';

@Injectable()
export class CookieAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    const user = await this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    }
    (req as Request & { user?: unknown }).user = user;
    return true;
  }
}
