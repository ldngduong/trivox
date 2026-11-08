import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AgentModule } from './modules/agent/agent.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    AgentModule,
    ProjectsModule,
  ],
})
export class AppModule {}
