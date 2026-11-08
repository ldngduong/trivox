import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../database/entities/project.entity.js';
import { ProjectRevisionEntity } from '../database/entities/project-revision.entity.js';
import { ProjectMessageEntity } from '../database/entities/project-message.entity.js';
import { AgentController } from './controllers/agent.controller.js';
import { AgentService } from './services/agent.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectRevisionEntity,
      ProjectMessageEntity,
    ]),
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
