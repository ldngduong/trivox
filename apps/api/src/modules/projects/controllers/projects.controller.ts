import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CookieAuthGuard } from '../../auth/guards/cookie-auth.guard.js';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface.js';
import { CreateProjectDto } from '../dto/create-project.dto.js';
import { UpdateJointValuesDto } from '../dto/update-joint-values.dto.js';
import { ProjectsService } from '../services/projects.service.js';

@Controller('api/projects')
@UseGuards(CookieAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  private getUser(req: Request): AuthUser {
    return (req as Request & { user: AuthUser }).user;
  }

  @Get()
  async listProjects(@Req() req: Request) {
    const user = this.getUser(req);
    const projects = await this.projectsService.listUserProjects(user.id);
    return { projects };
  }

  @Post()
  async createProject(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const user = this.getUser(req);
    const project = await this.projectsService.createProject(user.id, dto);
    return { project };
  }

  @Get(':id')
  async getProject(@Req() req: Request, @Param('id') id: string) {
    const user = this.getUser(req);
    const project = await this.projectsService.getProjectForUser(user.id, id);
    return { project };
  }

  @Patch(':id/joints')
  async updateJoints(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateJointValuesDto,
  ) {
    const user = this.getUser(req);
    const jointValues = await this.projectsService.updateJointValues(
      user.id,
      id,
      dto,
    );
    return { jointValues };
  }

  @Post(':id/revisions/:revisionId/restore')
  async restoreRevision(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
  ) {
    const user = this.getUser(req);
    const project = await this.projectsService.restoreRevision(
      user.id,
      id,
      revisionId,
    );
    return { project };
  }

  @Delete(':id')
  async deleteProject(@Req() req: Request, @Param('id') id: string) {
    const user = this.getUser(req);
    return this.projectsService.deleteProject(user.id, id);
  }
}
