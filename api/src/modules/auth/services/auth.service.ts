import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { UserEntity } from '../../database/entities/user.entity.js';
import type {
  AuthUser,
  JwtPayload,
} from '../interfaces/auth-user.interface.js';
import type { RegisterDto } from '../dto/register.dto.js';
import type { LoginDto } from '../dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  getFrontendUrl(): string {
    return (
      this.config.get<string>('FRONTEND_URL') || 'http://127.0.0.1:5173'
    ).replace(/\/+$/, '');
  }

  private getGoogleOAuthClient(): OAuth2Client | null {
    const clientId = (this.config.get<string>('GOOGLE_CLIENT_ID') || '').trim();
    const clientSecret = (
      this.config.get<string>('GOOGLE_CLIENT_SECRET') || ''
    ).trim();
    const callbackUrl = (
      this.config.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://127.0.0.1:5173/api/auth/google/callback'
    ).trim();

    if (!clientId || !clientSecret) {
      return null;
    }

    return new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri: callbackUrl,
    });
  }

  private toAuthUser(entity: UserEntity): AuthUser {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      role: entity.role,
      avatarUrl: entity.avatarUrl,
      authProvider: entity.authProvider,
    };
  }

  private signUserToken(user: UserEntity): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  createGoogleAuthRedirect(): { url: string; state: string } | null {
    const client = this.getGoogleOAuthClient();
    if (!client) {
      return null;
    }

    const state = crypto.randomBytes(24).toString('hex');
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
      state,
    });

    return { url, state };
  }

  async handleGoogleCallback(
    code: string,
  ): Promise<{ token: string; user: AuthUser }> {
    const client = this.getGoogleOAuthClient();
    const clientId = (this.config.get<string>('GOOGLE_CLIENT_ID') || '').trim();

    if (!client || !clientId) {
      throw new UnauthorizedException(
        'Chưa cấu hình đầy đủ Google OAuth trên máy chủ.',
      );
    }

    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      throw new UnauthorizedException('Không nhận được mã xác thực từ Google.');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new UnauthorizedException('Thông tin tài khoản Google không hợp lệ.');
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = payload.sub;
    const displayName = payload.name || email.split('@')[0] || 'User';
    const picture = payload.picture || null;

    let user = await this.userRepo.findOne({
      where: [{ googleId }, { email }],
    });

    if (!user) {
      user = this.userRepo.create({
        email,
        name: displayName,
        googleId,
        avatarUrl: picture,
        passwordHash: null,
        role: 'user',
        authProvider: 'google',
      });
    } else {
      user.googleId = googleId;
      if (picture && !user.avatarUrl) {
        user.avatarUrl = picture;
      }
    }

    const saved = await this.userRepo.save(user);
    return {
      token: this.signUserToken(saved),
      user: this.toAuthUser(saved),
    };
  }

  async register(dto: RegisterDto): Promise<{ token: string; user: AuthUser }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email này đã được đăng ký.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = this.userRepo.create({
      email: normalizedEmail,
      name: dto.name.trim(),
      passwordHash,
      role: 'user',
      authProvider: 'local',
      avatarUrl: null,
      googleId: null,
    });

    const saved = await this.userRepo.save(created);
    return {
      token: this.signUserToken(saved),
      user: this.toAuthUser(saved),
    };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: AuthUser }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: normalizedEmail })
      .getOne();

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    return {
      token: this.signUserToken(user),
      user: this.toAuthUser(user),
    };
  }

  async validateToken(token?: string): Promise<AuthUser | null> {
    if (!token) return null;
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const user = await this.userRepo.findOne({ where: { id: decoded.sub } });
      if (!user) return null;
      return this.toAuthUser(user);
    } catch {
      return null;
    }
  }
}
