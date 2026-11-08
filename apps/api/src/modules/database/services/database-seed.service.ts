import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity.js';

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.dataSource.query(`CREATE SCHEMA IF NOT EXISTS app;`);
    await this.seedAdminAccount();
  }

  private async seedAdminAccount() {
    const adminEmail = (
      this.config.get<string>('ADMIN_SEED_EMAIL') || 'admin@trivox.io'
    )
      .trim()
      .toLowerCase();
    const adminPassword =
      this.config.get<string>('ADMIN_SEED_PASSWORD') || 'Admin@Trivox2026';
    const adminName =
      this.config.get<string>('ADMIN_SEED_NAME') || 'Trivox Admin';

    const existing = await this.userRepo.findOne({
      where: { email: adminEmail },
    });

    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await this.userRepo.save(existing);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = this.userRepo.create({
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: 'admin',
      authProvider: 'local',
      avatarUrl: null,
      googleId: null,
    });

    await this.userRepo.save(admin);
    this.logger.log(`Seeded admin account: ${adminEmail}`);
  }
}
