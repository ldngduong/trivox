import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../database/entities/project.entity.js';
import { ProjectRevisionEntity } from '../database/entities/project-revision.entity.js';
import { ProjectMessageEntity } from '../database/entities/project-message.entity.js';
import { AgentModule } from '../agent/agent.module.js';
import { ProjectsController } from './controllers/projects.controller.js';
import { ProjectsService } from './services/projects.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectRevisionEntity,
      ProjectMessageEntity,
    ]),
    AgentModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
