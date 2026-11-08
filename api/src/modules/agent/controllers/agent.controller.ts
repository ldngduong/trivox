import {
  Body,
  Controller,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { CookieAuthGuard } from '../../auth/guards/cookie-auth.guard.js';
import { CompileModelDto } from '../dto/compile-model.dto.js';
import { SendPromptDto } from '../dto/send-prompt.dto.js';
import { AgentService } from '../services/agent.service.js';

@Controller('api/agent')
@UseGuards(CookieAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  async sendPrompt(@Body() dto: SendPromptDto) {
    return this.agentService.handleUserPrompt(dto);
  }

  @Post('compile')
  async compileDirect(@Body() dto: CompileModelDto) {
    const result = await this.agentService.compileAndPersistRevision(
      dto.projectId,
      dto.code,
      dto.summary || 'Cập nhật từ trình sửa mã',
    );
    const project = await this.agentService.getProjectDetail(dto.projectId);
    return {
      ...result,
      project,
    };
  }

  @Sse('stream')
  streamEvents(
    @Query('projectId') projectId: string,
  ): Observable<{ data: string }> {
    return this.agentService.getStream(projectId).pipe(
      map((event) => ({
        data: JSON.stringify(event),
      })),
    );
  }
}
