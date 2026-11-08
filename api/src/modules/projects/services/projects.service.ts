import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../database/entities/project.entity.js';
import { ProjectRevisionEntity } from '../../database/entities/project-revision.entity.js';
import { ProjectMessageEntity } from '../../database/entities/project-message.entity.js';
import { R2StorageService } from '../../storage/services/r2-storage.service.js';
import { AgentService } from '../../agent/services/agent.service.js';
import { INITIAL_STARTER_CODE } from '../constants/starter-model.constants.js';
import type { CreateProjectDto } from '../dto/create-project.dto.js';
import type { UpdateJointValuesDto } from '../dto/update-joint-values.dto.js';
import type {
  ProjectDetail,
  ProjectSummary,
} from '../../agent/interfaces/agent-session.interface.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(ProjectRevisionEntity)
    private readonly revisionRepo: Repository<ProjectRevisionEntity>,
    @InjectRepository(ProjectMessageEntity)
    private readonly messageRepo: Repository<ProjectMessageEntity>,
    private readonly storage: R2StorageService,
    private readonly agentService: AgentService,
  ) {}

  async listUserProjects(userId: string): Promise<ProjectSummary[]> {
    const projects = await this.projectRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    return projects.map((p) => this.agentService.toProjectSummary(p));
  }

  async getProjectForUser(
    userId: string,
    projectId: string,
  ): Promise<ProjectDetail> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này.');
    }
    return this.agentService.getProjectDetail(projectId);
  }

  async createProject(
    userId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectDetail> {
    const created = this.projectRepo.create({
      userId,
      title: dto.title.trim(),
      description: dto.prompt?.trim() || null,
      status: 'generating',
      currentCode: INITIAL_STARTER_CODE,
      modelVersion: 0,
      glbKey: null,
      glbUrl: null,
      blendKey: null,
      blendUrl: null,
      referenceImageKey: null,
      referenceImageUrl: null,
      dimensions: { width: 160, depth: 160, height: 164 },
      joints: [],
      parts: [],
      jointValues: {},
    });

    const saved = await this.projectRepo.save(created);

    if (dto.imageBase64) {
      const uploadedImg = await this.storage.uploadBase64Image(
        `projects/${saved.id}/reference`,
        dto.imageBase64,
      );
      saved.referenceImageKey = uploadedImg.key;
      saved.referenceImageUrl = uploadedImg.url;
      await this.projectRepo.save(saved);
    }

    await this.agentService.compileAndPersistRevision(
      saved.id,
      INITIAL_STARTER_CODE,
      'Khởi tạo khung hình học cơ sở',
    );

    if (dto.prompt?.trim() || dto.imageBase64) {
      await this.agentService.handleUserPrompt({
        projectId: saved.id,
        prompt:
          dto.prompt?.trim() ||
          `Thiết kế mô hình 3D cho dự án "${saved.title}" dựa trên ảnh tham chiếu.`,
        imageBase64: dto.imageBase64,
      });
    } else {
      await this.messageRepo.save(
        this.messageRepo.create({
          projectId: saved.id,
          role: 'assistant',
          content: `Dự án "${saved.title}" đã được khởi tạo. Bạn có thể tải ảnh tham chiếu hoặc nhập yêu cầu để Agent dựng mô hình 3D.`,
          steps: [
            {
              id: `init-${Date.now()}`,
              label: 'Khởi tạo khung hình học cơ sở',
              status: 'completed',
              elapsedMs: 180,
            },
          ],
        }),
      );
    }

    return this.agentService.getProjectDetail(saved.id);
  }

  async updateJointValues(
    userId: string,
    projectId: string,
    dto: UpdateJointValuesDto,
  ): Promise<Record<string, number>> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này.');
    }

    const nextValues = { ...(project.jointValues || {}) };
    for (const [k, v] of Object.entries(dto.jointValues || {})) {
      if (typeof v === 'number') {
        nextValues[k] = v;
      }
    }
    project.jointValues = nextValues;
    await this.projectRepo.save(project);
    return nextValues;
  }

  async restoreRevision(
    userId: string,
    projectId: string,
    revisionId: string,
  ): Promise<ProjectDetail> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập dự án này.');
    }

    const revision = await this.revisionRepo.findOne({
      where: { id: revisionId, projectId },
    });
    if (!revision) {
      throw new NotFoundException('Không tìm thấy phiên bản mô hình.');
    }

    project.currentCode = revision.code;
    project.modelVersion = revision.version;
    project.glbKey = revision.glbKey;
    project.glbUrl = revision.glbUrl;
    project.blendKey = revision.blendKey;
    project.blendUrl = revision.blendUrl;
    project.dimensions = revision.dimensions;
    project.joints = revision.joints;
    project.parts = revision.parts;

    const nextValues: Record<string, number> = {};
    for (const j of revision.joints || []) {
      nextValues[j.id] = j.default ?? 0;
    }
    project.jointValues = nextValues;

    await this.projectRepo.save(project);
    const detail = await this.agentService.getProjectDetail(projectId);
    this.agentService.emit(projectId, {
      type: 'model_updated',
      payload: detail,
    });
    return detail;
  }

  async deleteProject(userId: string, projectId: string): Promise<{ ok: boolean }> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa dự án này.');
    }

    await this.projectRepo.remove(project);
    return { ok: true };
  }
}
