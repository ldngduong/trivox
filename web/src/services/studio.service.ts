import type {
  ProjectDetail,
  ProjectSummary,
} from '../types/studio.types';
import { apiRequest } from './http.client';

export function fetchProjectsList(): Promise<{ projects: ProjectSummary[] }> {
  return apiRequest<{ projects: ProjectSummary[] }>('/api/projects', {
    method: 'GET',
  });
}

export function createNewProject(payload: {
  title: string;
  prompt?: string;
  imageBase64?: string;
}): Promise<{ project: ProjectDetail }> {
  return apiRequest<{ project: ProjectDetail }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchProjectDetail(
  projectId: string,
): Promise<{ project: ProjectDetail }> {
  return apiRequest<{ project: ProjectDetail }>(`/api/projects/${projectId}`, {
    method: 'GET',
  });
}

export function persistProjectJointValues(payload: {
  projectId: string;
  jointValues: Record<string, number>;
}): Promise<{ jointValues: Record<string, number> }> {
  return apiRequest<{ jointValues: Record<string, number> }>(
    `/api/projects/${payload.projectId}/joints`,
    {
      method: 'PATCH',
      body: JSON.stringify({ jointValues: payload.jointValues }),
    },
  );
}

export function restoreProjectRevision(payload: {
  projectId: string;
  revisionId: string;
}): Promise<{ project: ProjectDetail }> {
  return apiRequest<{ project: ProjectDetail }>(
    `/api/projects/${payload.projectId}/revisions/${payload.revisionId}/restore`,
    {
      method: 'POST',
    },
  );
}

export function deleteProjectById(projectId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  });
}

export function sendAgentPrompt(payload: {
  projectId: string;
  prompt: string;
  imageBase64?: string;
}): Promise<{ messageId: string }> {
  return apiRequest<{ messageId: string }>('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function compileProjectCodeDirect(payload: {
  projectId: string;
  code: string;
  summary?: string;
}): Promise<{
  ok: boolean;
  elapsedMs: number;
  error?: string;
  project: ProjectDetail;
}> {
  return apiRequest<{
    ok: boolean;
    elapsedMs: number;
    error?: string;
    project: ProjectDetail;
  }>('/api/agent/compile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const studioService = {
  listProjects: fetchProjectsList,
  createProject: createNewProject,
  getProject: fetchProjectDetail,
  updateJoints: persistProjectJointValues,
  restoreRevision: restoreProjectRevision,
  deleteProject: deleteProjectById,
  sendPrompt: sendAgentPrompt,
  compileDirect: compileProjectCodeDirect,
};
