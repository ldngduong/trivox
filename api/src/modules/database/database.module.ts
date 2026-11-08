import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity.js';
import { ProjectEntity } from './entities/project.entity.js';
import { ProjectRevisionEntity } from './entities/project-revision.entity.js';
import { ProjectMessageEntity } from './entities/project-message.entity.js';
import { DatabaseSeedService } from './services/database-seed.service.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rawUrl =
          config.get<string>('DATABASE_URL') ||
          'postgresql://postgres:postgres@localhost:5432/trivox?schema=app';
        const parsed = new URL(rawUrl);
        const schema = parsed.searchParams.get('schema') || 'app';
        parsed.searchParams.delete('schema');

        return {
          type: 'postgres',
          url: parsed.toString(),
          schema,
          entities: [
            UserEntity,
            ProjectEntity,
            ProjectRevisionEntity,
            ProjectMessageEntity,
          ],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      ProjectEntity,
      ProjectRevisionEntity,
      ProjectMessageEntity,
    ]),
  ],
  providers: [DatabaseSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
