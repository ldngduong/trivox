export interface JointMeta {
  id: string;
  label: string;
  type: 'revolute' | 'continuous' | 'prismatic' | 'free';
  unit: string;
  min: number;
  max: number;
  default: number;
}

export interface PartMeta {
  id: string;
  label: string;
}

export interface ModelDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface ToolStep {
  id: string;
  label: string;
  status: 'running' | 'completed' | 'error';
  detail?: string;
  elapsedMs?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string | null;
  steps?: ToolStep[];
  createdAt: string;
}

export interface ProjectRevisionSummary {
  id: string;
  version: number;
  summary: string;
  glbUrl: string | null;
  blendUrl: string | null;
  dimensions: ModelDimensions;
  jointsCount: number;
  partsCount: number;
  createdAt: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'generating' | 'ready' | 'failed';
  modelVersion: number;
  glbUrl: string | null;
  blendUrl: string | null;
  referenceImageUrl: string | null;
  dimensions: ModelDimensions;
  jointsCount: number;
  partsCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'generating' | 'ready' | 'failed';
  code: string;
  modelVersion: number;
  glbUrl: string | null;
  blendUrl: string | null;
  referenceImageUrl: string | null;
  dimensions: ModelDimensions;
  joints: JointMeta[];
  parts: PartMeta[];
  jointValues: Record<string, number>;
  messages: ChatMessage[];
  revisions: ProjectRevisionSummary[];
  updatedAt: string;
  createdAt: string;
}

export interface AgentStreamEvent {
  type:
    | 'step_start'
    | 'step_update'
    | 'model_updated'
    | 'pose_updated'
    | 'assistant_message'
    | 'done';
  payload: unknown;
}
