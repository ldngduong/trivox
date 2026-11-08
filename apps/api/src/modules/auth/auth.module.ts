import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../database/entities/user.entity.js';
import { JWT_EXPIRES_IN } from './constants/auth.constants.js';
import { AuthController } from './controllers/auth.controller.js';
import { CookieAuthGuard } from './guards/cookie-auth.guard.js';
import { AuthService } from './services/auth.service.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ||
          'trivox-prod-jwt-secret-key-change-in-production-2026',
        signOptions: { expiresIn: JWT_EXPIRES_IN },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CookieAuthGuard],
  exports: [AuthService, CookieAuthGuard, JwtModule],
})
export class AuthModule {}
