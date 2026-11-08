import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import OpenAI from 'openai';
import * as fs from 'node:fs';
import { ProjectEntity } from '../../database/entities/project.entity.js';
import { ProjectRevisionEntity } from '../../database/entities/project-revision.entity.js';
import { ProjectMessageEntity } from '../../database/entities/project-message.entity.js';
import { R2StorageService } from '../../storage/services/r2-storage.service.js';
import type {
  AgentStreamEvent,
  ChatMessage,
  JointMeta,
  ModelDimensions,
  PartMeta,
  ProjectDetail,
  ProjectRevisionSummary,
  ProjectSummary,
  ToolStep,
} from '../interfaces/agent-session.interface.js';
import type { SendPromptDto } from '../dto/send-prompt.dto.js';
import { SAND3D_API_REFERENCE } from '../constants/sand3d-reference.constants.js';
import {
  formatJointLabel,
  formatPartLabel,
} from '../utils/label-formatter.util.js';
import {
  applyCodePatches,
  type CodePatchItem,
} from '../utils/code-patcher.util.js';

@Injectable()
export class AgentService {
  private streams = new Map<string, Subject<AgentStreamEvent>>();

  constructor(
    private readonly config: ConfigService,
    private readonly storage: R2StorageService,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(ProjectRevisionEntity)
    private readonly revisionRepo: Repository<ProjectRevisionEntity>,
    @InjectRepository(ProjectMessageEntity)
    private readonly messageRepo: Repository<ProjectMessageEntity>,
  ) {}

  getStream(projectId: string): Observable<AgentStreamEvent> {
    if (!this.streams.has(projectId)) {
      this.streams.set(projectId, new Subject<AgentStreamEvent>());
    }
    return this.streams.get(projectId)!.asObservable();
  }

  emit(projectId: string, event: AgentStreamEvent) {
    const stream = this.streams.get(projectId);
    if (stream) {
      stream.next(event);
    }
  }

  toProjectSummary(entity: ProjectEntity): ProjectSummary {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      modelVersion: entity.modelVersion,
      glbUrl: entity.glbUrl,
      blendUrl: entity.blendUrl,
      referenceImageUrl: entity.referenceImageUrl,
      dimensions: entity.dimensions || { width: 0, depth: 0, height: 0 },
      jointsCount: Array.isArray(entity.joints) ? entity.joints.length : 0,
      partsCount: Array.isArray(entity.parts) ? entity.parts.length : 0,
      updatedAt: entity.updatedAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }

  async getProjectDetail(projectId: string): Promise<ProjectDetail> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }

    const messages = await this.messageRepo.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });

    const revisions = await this.revisionRepo.find({
      where: { projectId },
      order: { version: 'DESC' },
    });

    const mappedMessages: ChatMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      imageUrl: m.imageUrl,
      steps: m.steps || [],
      createdAt: m.createdAt.toISOString(),
    }));

    const mappedRevisions: ProjectRevisionSummary[] = revisions.map((r) => ({
      id: r.id,
      version: r.version,
      summary: r.summary,
      glbUrl: r.glbUrl,
      blendUrl: r.blendUrl,
      dimensions: r.dimensions || { width: 0, depth: 0, height: 0 },
      jointsCount: Array.isArray(r.joints) ? r.joints.length : 0,
      partsCount: Array.isArray(r.parts) ? r.parts.length : 0,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      code: project.currentCode,
      modelVersion: project.modelVersion,
      glbUrl: project.glbUrl,
      blendUrl: project.blendUrl,
      referenceImageUrl: project.referenceImageUrl,
      dimensions: project.dimensions || { width: 0, depth: 0, height: 0 },
      joints: project.joints || [],
      parts: project.parts || [],
      jointValues: project.jointValues || {},
      messages: mappedMessages,
      revisions: mappedRevisions,
      updatedAt: project.updatedAt.toISOString(),
      createdAt: project.createdAt.toISOString(),
    };
  }

  async compileAndPersistRevision(
    projectId: string,
    code: string,
    summary = 'Biên dịch mô hình 3D',
  ): Promise<{
    ok: boolean;
    elapsedMs: number;
    error?: string;
    traceback?: string;
    parts?: PartMeta[];
    joints?: JointMeta[];
    dimensions?: ModelDimensions;
    glbUrl?: string;
    blendUrl?: string | null;
  }> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }

    const nextVersion = (project.modelVersion || 0) + 1;
    const workerUrl =
      this.config.get<string>('PYTHON_WORKER_URL') || 'http://127.0.0.1:8001';
    const tempBuildPath = this.storage.getTempBuildPath(projectId, nextVersion);

    try {
      const response = await fetch(`${workerUrl}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: projectId,
          code,
          outputPath: tempBuildPath,
          timeoutSec: 30,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        elapsedMs: number;
        blendPath?: string | null;
        error?: string;
        traceback?: string;
        parts?: string[];
        joints?: Array<{
          id: string;
          type: 'revolute' | 'continuous' | 'prismatic' | 'free';
          unit: string;
          min: number;
          max: number;
          default: number;
        }>;
        dimensions?: ModelDimensions;
      };

      if (!data.ok || !fs.existsSync(tempBuildPath)) {
        return {
          ok: false,
          elapsedMs: data.elapsedMs || 0,
          error: data.error || 'Lỗi biên dịch hình học 3D',
          traceback: data.traceback,
        };
      }

      const glbBuffer = fs.readFileSync(tempBuildPath);
      const glbStorageKey = `projects/${projectId}/v${nextVersion}.glb`;
      const uploadedGlb = await this.storage.uploadBuffer(
        glbStorageKey,
        glbBuffer,
        'model/gltf-binary',
      );

      let blendKey: string | null = null;
      let blendUrl: string | null = null;
      const tempBlendPath = tempBuildPath.replace(/\.glb$/i, '.blend');
      if (fs.existsSync(tempBlendPath)) {
        const blendBuffer = fs.readFileSync(tempBlendPath);
        const blendStorageKey = `projects/${projectId}/v${nextVersion}.blend`;
        const uploadedBlend = await this.storage.uploadBuffer(
          blendStorageKey,
          blendBuffer,
          'application/x-blender',
        );
        blendKey = uploadedBlend.key;
        blendUrl = `${uploadedBlend.url}?v=${nextVersion}`;
      }

      const mappedJoints: JointMeta[] = (data.joints || []).map((j) => ({
        ...j,
        label: formatJointLabel(j.id),
      }));
      const mappedParts: PartMeta[] = (data.parts || []).map((p) => ({
        id: p,
        label: formatPartLabel(p),
      }));

      const nextValues: Record<string, number> = {};
      for (const j of mappedJoints) {
        nextValues[j.id] = project.jointValues?.[j.id] ?? j.default ?? 0;
      }

      project.currentCode = code;
      project.modelVersion = nextVersion;
      project.glbKey = uploadedGlb.key;
      project.glbUrl = `${uploadedGlb.url}?v=${nextVersion}`;
      project.blendKey = blendKey;
      project.blendUrl = blendUrl;
      project.dimensions = data.dimensions || { width: 0, depth: 0, height: 0 };
      project.joints = mappedJoints;
      project.parts = mappedParts;
      project.jointValues = nextValues;
      project.status = 'ready';

      await this.projectRepo.save(project);

      const revision = this.revisionRepo.create({
        projectId: project.id,
        version: nextVersion,
        summary,
        code,
        glbKey: uploadedGlb.key,
        glbUrl: project.glbUrl,
        blendKey,
        blendUrl,
        dimensions: project.dimensions,
        joints: mappedJoints,
        parts: mappedParts,
      });
      await this.revisionRepo.save(revision);

      return {
        ok: true,
        elapsedMs: data.elapsedMs,
        parts: mappedParts,
        joints: mappedJoints,
        dimensions: project.dimensions,
        glbUrl: project.glbUrl,
        blendUrl: project.blendUrl,
      };
    } catch (err) {
      return {
        ok: false,
        elapsedMs: 0,
        error:
          err instanceof Error
            ? `Không thể kết nối dịch vụ biên dịch 3D: ${err.message}`
            : 'Lỗi kết nối dịch vụ biên dịch 3D',
      };
    }
  }

  async handleUserPrompt(dto: SendPromptDto): Promise<{ messageId: string }> {
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Không tìm thấy dự án.');
    }

    let uploadedImageUrl: string | null = null;
    if (dto.imageBase64) {
      const uploadedImg = await this.storage.uploadBase64Image(
        `projects/${project.id}/ref-${Date.now()}`,
        dto.imageBase64,
      );
      uploadedImageUrl = uploadedImg.url;
      project.referenceImageKey = uploadedImg.key;
      project.referenceImageUrl = uploadedImg.url;
      await this.projectRepo.save(project);
    }

    const userMsgEntity = this.messageRepo.create({
      projectId: project.id,
      role: 'user',
      content: dto.prompt || 'Phân tích ảnh tham chiếu và dựng mô hình 3D.',
      imageUrl: uploadedImageUrl,
      steps: [],
    });
    const savedMsg = await this.messageRepo.save(userMsgEntity);

    void this.executeAgentHarnessJob(project.id, savedMsg, dto.imageBase64);

    return { messageId: savedMsg.id };
  }

  private async analyzeImageWithGroq(
    imageBase64: string,
    userPrompt: string,
    groqKey: string,
  ): Promise<string> {
    const baseURL =
      this.config.get<string>('GROQ_BASE_URL') ||
      'https://api.groq.com/openai/v1';
    const visionModel =
      this.config.get<string>('GROQ_VISION_MODEL') || 'qwen/qwen3.8-27b';

    const groqClient = new OpenAI({
      apiKey: groqKey,
      baseURL,
    });

    const res = await groqClient.chat.completions.create({
      model: visionModel,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'Hãy phân tích hình ảnh vật thể này thành bản thông số kỹ thuật CAD 3D chi tiết để dựng mô hình:',
                '1. Kích thước tổng thể ước lượng (rộng, sâu, cao theo mm).',
                '2. Danh sách từng bộ phận cấu thành (tên bộ phận tiếng Anh snake_case, hình khối cơ bản, vị trí tương đối, tỷ lệ kích thước).',
                '3. Vật liệu PBR và mã màu hex (#rrggbb) sát thực tế nhất cho từng bộ phận.',
                '4. Các khớp chuyển động có thể có (revolute, prismatic, continuous) kèm trục và biên độ.',
                userPrompt ? `Yêu cầu bổ sung của người dùng: ${userPrompt}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
    });

    return res.choices[0]?.message?.content || '';
  }

  async executeAgentHarnessJob(
    projectId: string,
    userMsg: ProjectMessageEntity,
    rawImageBase64?: string,
  ) {
    const steps: ToolStep[] = [];
    const addStep = (id: string, label: string, detail?: string): ToolStep => {
      const step: ToolStep = { id, label, status: 'running', detail };
      steps.push(step);
      this.emit(projectId, { type: 'step_start', payload: step });
      return step;
    };
    const finishStep = (
      step: ToolStep,
      status: 'completed' | 'error',
      detail?: string,
      elapsedMs?: number,
    ) => {
      step.status = status;
      if (detail !== undefined) step.detail = detail;
      if (elapsedMs !== undefined) step.elapsedMs = elapsedMs;
      this.emit(projectId, { type: 'step_update', payload: step });
    };

    const groqKey = (this.config.get<string>('GROQ_API_KEY') || '').trim();
    const deepseekKey = (
      this.config.get<string>('DEEPSEEK_API_KEY') || ''
    ).trim();

    try {
      let project = await this.projectRepo.findOne({
        where: { id: projectId },
      });
      if (!project) return;

      if (!deepseekKey && !groqKey) {
        const missingStep = addStep(
          `step-key-${Date.now()}`,
          'Kiểm tra dịch vụ xử lý',
        );
        finishStep(
          missingStep,
          'error',
          'Dịch vụ AI chưa được cấu hình trên máy chủ.',
          5,
        );

        const assistantMsg = await this.messageRepo.save(
          this.messageRepo.create({
            projectId,
            role: 'assistant',
            content:
              'Máy chủ hiện chưa cấu hình khóa dịch vụ AI trong tệp môi trường (.env).',
            steps,
          }),
        );

        this.emit(projectId, {
          type: 'assistant_message',
          payload: {
            id: assistantMsg.id,
            role: assistantMsg.role,
            content: assistantMsg.content,
            steps: assistantMsg.steps,
            createdAt: assistantMsg.createdAt.toISOString(),
          },
        });
        this.emit(projectId, { type: 'done', payload: {} });
        return;
      }

      let visionBlueprint = '';
      if (rawImageBase64 && groqKey) {
        const vStep = addStep(
          `step-vision-${Date.now()}`,
          'Phân tích cấu trúc từ ảnh tham chiếu',
        );
        const t0 = Date.now();
        try {
          visionBlueprint = await this.analyzeImageWithGroq(
            rawImageBase64,
            userMsg.content,
            groqKey,
          );
          finishStep(vStep, 'completed', visionBlueprint, Date.now() - t0);
        } catch (err) {
          finishStep(
            vStep,
            'error',
            err instanceof Error ? err.message : 'Lỗi phân tích ảnh',
            Date.now() - t0,
          );
        }
      }

      const recentDbMessages = await this.messageRepo.find({
        where: { projectId },
        order: { createdAt: 'DESC' },
        take: 7,
      });
      const priorContextLines = recentDbMessages
        .filter((m) => m.id !== userMsg.id)
        .reverse()
        .map(
          (m) =>
            `${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.content.slice(0, 300)}`,
        );

      const useDeepSeek = Boolean(deepseekKey);
      const llmClient = new OpenAI({
        apiKey: useDeepSeek ? deepseekKey : groqKey,
        baseURL: useDeepSeek
          ? this.config.get<string>('DEEPSEEK_BASE_URL') ||
            'https://api.deepseek.com'
          : this.config.get<string>('GROQ_BASE_URL') ||
            'https://api.groq.com/openai/v1',
      });
      const llmModel = useDeepSeek
        ? this.config.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat'
        : this.config.get<string>('GROQ_FALLBACK_MODEL') ||
          'openai/gpt-oss-120b';

      const systemPrompt = [
        'Bạn là kỹ sư thiết kế 3D chuyên nghiệp trong nền tảng Trivox.',
        'Nhiệm vụ của bạn là tạo mới hoặc chỉnh sửa mô hình 3D theo yêu cầu của người dùng.',
        'QUY TẮC BẮT BUỘC:',
        '1. Mã nguồn Python phải bắt đầu bằng `import sand3d as s3d` (có thể thêm `import math` nếu cần) và định nghĩa hàm `def build():` trả về đối tượng gốc hoặc `s3d.assembly(...)`. Không gọi `s3d.export()` trong code.',
        '2. ƯU TIÊN TỐI ĐA công cụ `patch_model_code` khi chỉnh sửa mô hình hiện có (ví dụ: đổi màu sắc, thay đổi kích thước, thêm/bớt chi tiết, chỉnh biên độ khớp) để thực thi nhanh và giữ nguyên các chi tiết khác.',
        '3. Chỉ gọi `update_and_compile_model` khi cần dựng mới hoàn toàn mô hình từ đầu hoặc thay đổi toàn bộ kiến trúc.',
        '4. Nếu người dùng chỉ yêu cầu đóng/mở/trượt/xoay các khớp hiện có, hãy gọi `adjust_joint_poses`.',
        '5. Trả lời bằng tiếng Việt ngắn gọn, tự nhiên, đi thẳng vào kết quả. Tuyệt đối KHÔNG nhắc đến tên thư viện nội bộ (`sand3d`, `bpy`), không dùng câu chữ sáo rỗng, không dùng emoji.',
        '',
        'TÀI LIỆU THAM CHIẾU API:',
        SAND3D_API_REFERENCE,
      ].join('\n');

      const conversationHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              `Tên dự án: ${project.title}`,
              priorContextLines.length > 0
                ? `Ngữ cảnh hội thoại gần đây:\n${priorContextLines.join('\n')}`
                : '',
              project.currentCode
                ? `Mã nguồn mô hình hiện tại:\n\`\`\`python\n${project.currentCode}\n\`\`\``
                : 'Dự án chưa có mã nguồn mô hình, hãy dùng `update_and_compile_model` để tạo mới.',
              `Danh sách khớp hiện tại: ${JSON.stringify(project.joints || [])}`,
              `Giá trị góc/vị trí khớp hiện tại: ${JSON.stringify(project.jointValues || {})}`,
              visionBlueprint
                ? `Bản phân tích kỹ thuật từ ảnh tham chiếu:\n${visionBlueprint}`
                : '',
              `Yêu cầu hiện tại của người dùng: ${userMsg.content}`,
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
        ];

      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'patch_model_code',
            description:
              'Chỉnh sửa nhanh từng đoạn mã trong mô hình 3D hiện tại bằng danh sách tìm-và-thay-thế (target -> replacement) rồi biên dịch lại ngay. Luôn ưu tiên dùng khi đổi màu, đổi kích thước hoặc thêm/sửa chi tiết trên mô hình sẵn có.',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description:
                    'Mô tả ngắn gọn tiếng Việt (4-8 từ) về thay đổi đang thực hiện',
                },
                patches: {
                  type: 'array',
                  description:
                    'Danh sách các cặp đoạn code gốc cần tìm và đoạn code mới thay thế',
                  items: {
                    type: 'object',
                    properties: {
                      target: {
                        type: 'string',
                        description:
                          'Đoạn code chính xác đang có trong mã nguồn hiện tại',
                      },
                      replacement: {
                        type: 'string',
                        description: 'Đoạn code mới thay thế cho target',
                      },
                    },
                    required: ['target', 'replacement'],
                  },
                },
              },
              required: ['summary', 'patches'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'update_and_compile_model',
            description:
              'Ghi mới toàn bộ mã nguồn mô hình 3D và biên dịch khi tạo vật thể mới hoàn toàn hoặc thiết kế lại từ đầu.',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description:
                    'Mô tả ngắn gọn tiếng Việt (4-8 từ) về mô hình đang dựng',
                },
                code: {
                  type: 'string',
                  description:
                    'Toàn bộ mã nguồn Python định nghĩa hàm `def build():` trả về mô hình.',
                },
              },
              required: ['summary', 'code'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'adjust_joint_poses',
            description:
              'Điều chỉnh góc mở hoặc vị trí trượt của các khớp chuyển động trên mô hình hiện tại.',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'Mô tả ngắn gọn hành động',
                },
                values: {
                  type: 'object',
                  description: 'Map từ id khớp sang giá trị số (độ hoặc mm)',
                  additionalProperties: { type: 'number' },
                },
              },
              required: ['summary', 'values'],
            },
          },
        },
      ];

      let finalAssistantText = '';

      for (let attempt = 0; attempt < 4; attempt++) {
        const completion = await llmClient.chat.completions.create({
          model: llmModel,
          temperature: 0.2,
          messages: conversationHistory,
          tools,
          tool_choice: 'auto',
        });

        const msg = completion.choices[0]?.message;
        if (!msg) break;

        conversationHistory.push(msg);

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          finalAssistantText = msg.content || 'Đã hoàn tất yêu cầu.';
          break;
        }

        for (const toolCall of msg.tool_calls) {
          if (toolCall.type !== 'function') continue;
          const fnName = toolCall.function.name;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}') as Record<
              string,
              unknown
            >;
          } catch {
            args = {};
          }

          if (fnName === 'patch_model_code') {
            const label =
              typeof args.summary === 'string' && args.summary.trim()
                ? args.summary.trim()
                : 'Cập nhật tham số mô hình 3D';
            const patches = (args.patches || []) as CodePatchItem[];
            const pStep = addStep(`step-patch-${Date.now()}`, label);

            project = await this.projectRepo.findOne({
              where: { id: projectId },
            });
            const baseCode = project?.currentCode || '';
            const patched = applyCodePatches(baseCode, patches);

            if (!patched.ok) {
              finishStep(pStep, 'error', patched.error, 10);
              conversationHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  status: 'error',
                  error: patched.error,
                  currentCode: baseCode,
                  instruction:
                    'Hãy kiểm tra lại chuỗi target khớp chính xác với currentCode và thử lại.',
                }),
              });
              continue;
            }

            const compileRes = await this.compileAndPersistRevision(
              projectId,
              patched.code,
              label,
            );
            if (compileRes.ok) {
              finishStep(
                pStep,
                'completed',
                patched.code,
                compileRes.elapsedMs,
              );
              const detail = await this.getProjectDetail(projectId);
              this.emit(projectId, {
                type: 'model_updated',
                payload: detail,
              });
              conversationHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  status: 'success',
                  dimensions: compileRes.dimensions,
                  joints: compileRes.joints,
                  partsCount: compileRes.parts?.length || 0,
                }),
              });
            } else {
              finishStep(
                pStep,
                'error',
                `${compileRes.error}\n\n${patched.code}`,
                compileRes.elapsedMs,
              );
              conversationHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  status: 'error',
                  error: compileRes.error,
                  traceback: compileRes.traceback,
                  instruction:
                    'Mã sau khi patch gặp lỗi biên dịch. Hãy sửa lại thông qua patch_model_code hoặc update_and_compile_model.',
                }),
              });
            }
          } else if (fnName === 'update_and_compile_model') {
            const label =
              typeof args.summary === 'string' && args.summary.trim()
                ? args.summary.trim()
                : 'Dựng và biên dịch mô hình 3D';
            const code = typeof args.code === 'string' ? args.code : '';
            const cStep = addStep(`step-compile-${Date.now()}`, label, code);

            const compileRes = await this.compileAndPersistRevision(
              projectId,
              code,
              label,
            );
            if (compileRes.ok) {
              finishStep(cStep, 'completed', code, compileRes.elapsedMs);
              const detail = await this.getProjectDetail(projectId);
              this.emit(projectId, {
                type: 'model_updated',
                payload: detail,
              });
              conversationHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  status: 'success',
                  dimensions: compileRes.dimensions,
                  joints: compileRes.joints,
                  partsCount: compileRes.parts?.length || 0,
                }),
              });
            } else {
              finishStep(
                cStep,
                'error',
                `${compileRes.error}\n\n${code}`,
                compileRes.elapsedMs,
              );
              conversationHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  status: 'error',
                  error: compileRes.error,
                  traceback: compileRes.traceback,
                  instruction:
                    'Hãy sửa lỗi trên trong code và gọi lại update_and_compile_model.',
                }),
              });
            }
          } else if (fnName === 'adjust_joint_poses') {
            const label =
              typeof args.summary === 'string' && args.summary.trim()
                ? args.summary.trim()
                : 'Điều chỉnh vị trí các khớp chuyển động';
            const pStep = addStep(`step-pose-${Date.now()}`, label);
            const values = (args.values || {}) as Record<string, number>;

            const currentProject = await this.projectRepo.findOne({
              where: { id: projectId },
            });
            if (currentProject) {
              const nextJointValues = { ...(currentProject.jointValues || {}) };
              for (const [k, v] of Object.entries(values)) {
                if (typeof v === 'number') {
                  nextJointValues[k] = v;
                }
              }
              currentProject.jointValues = nextJointValues;
              await this.projectRepo.save(currentProject);

              finishStep(pStep, 'completed', JSON.stringify(values), 15);
              this.emit(projectId, {
                type: 'pose_updated',
                payload: nextJointValues,
              });
              conversationHistory.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify({
                  status: 'success',
                  jointValues: nextJointValues,
                }),
              });
            }
          }
        }
      }

      if (!finalAssistantText) {
        finalAssistantText = 'Đã cập nhật mô hình 3D và lưu phiên bản mới.';
      }

      const assistantEntity = await this.messageRepo.save(
        this.messageRepo.create({
          projectId,
          role: 'assistant',
          content: finalAssistantText,
          steps,
        }),
      );

      this.emit(projectId, {
        type: 'assistant_message',
        payload: {
          id: assistantEntity.id,
          role: assistantEntity.role,
          content: assistantEntity.content,
          steps: assistantEntity.steps,
          createdAt: assistantEntity.createdAt.toISOString(),
        },
      });
      this.emit(projectId, { type: 'done', payload: {} });
    } catch (err) {
      const errorText =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xử lý yêu cầu.';
      const errEntity = await this.messageRepo.save(
        this.messageRepo.create({
          projectId,
          role: 'assistant',
          content: `Không thể hoàn tất yêu cầu: ${errorText}`,
          steps,
        }),
      );
      this.emit(projectId, {
        type: 'assistant_message',
        payload: {
          id: errEntity.id,
          role: errEntity.role,
          content: errEntity.content,
          steps: errEntity.steps,
          createdAt: errEntity.createdAt.toISOString(),
        },
      });
      this.emit(projectId, { type: 'done', payload: {} });
    }
  }
}
