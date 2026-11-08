import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Code2,
  Cuboid,
  Download,
  Grid,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  Play,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CAMERA_PRESETS } from '@/constants/studio.constants';
import { AgentChatPanel } from '@/features/agent-chat/components/AgentChatPanel';
import { useLogoutMutation } from '@/features/auth/hooks/useAuthQueries';
import { InspectorPanel } from '@/features/inspector/components/InspectorPanel';
import { ViewportCanvas } from '@/features/viewport/components/ViewportCanvas';
import { studioService } from '@/services/studio.service';
import { useAuthStore } from '@/stores/auth.store';
import { useStudioUiStore } from '@/stores/studio-ui.store';
import type {
  ChatMessage,
  ProjectDetail,
  ToolStep,
} from '@/types/studio.types';

export function StudioPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();

  const [centerMode, setCenterMode] = useState<'viewport' | 'code'>('viewport');
  const [editorCode, setEditorCode] = useState('');
  const [compileError, setCompileError] = useState<string | null>(null);

  const setJointValues = useStudioUiStore((s) => s.setJointValues);
  const selectedPart = useStudioUiStore((s) => s.selectedPart);
  const setSelectedPart = useStudioUiStore((s) => s.setSelectedPart);
  const wireframe = useStudioUiStore((s) => s.wireframe);
  const setWireframe = useStudioUiStore((s) => s.setWireframe);
  const showRefImage = useStudioUiStore((s) => s.showRefImage);
  const setShowRefImage = useStudioUiStore((s) => s.setShowRefImage);
  const cameraPreset = useStudioUiStore((s) => s.cameraPreset);
  const triggerCameraPreset = useStudioUiStore((s) => s.triggerCameraPreset);
  const setActiveSteps = useStudioUiStore((s) => s.setActiveSteps);
  const appendActiveStep = useStudioUiStore((s) => s.appendActiveStep);
  const updateActiveStep = useStudioUiStore((s) => s.updateActiveStep);
  const setIsProcessing = useStudioUiStore((s) => s.setIsProcessing);

  const projectQuery = useQuery({
    queryKey: ['studio', 'project', projectId],
    queryFn: () => studioService.getProject(projectId!),
    enabled: Boolean(projectId),
  });

  const project = projectQuery.data?.project ?? null;

  useEffect(() => {
    if (project?.jointValues) {
      setJointValues(project.jointValues);
    }
    if (project?.code !== undefined) {
      setEditorCode(project.code);
    }
  }, [project?.modelVersion, project?.id, setJointValues]);

  useEffect(() => {
    if (!projectId) return;
    const es = new EventSource(`/api/agent/stream?projectId=${projectId}`, {
      withCredentials: true,
    });

    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data) as {
          type: string;
          payload: unknown;
        };

        if (parsed.type === 'step_start') {
          appendActiveStep(parsed.payload as ToolStep);
        } else if (parsed.type === 'step_update') {
          updateActiveStep(parsed.payload as ToolStep);
        } else if (parsed.type === 'model_updated') {
          const updatedProject = parsed.payload as ProjectDetail;
          queryClient.setQueryData<{ project: ProjectDetail }>(
            ['studio', 'project', projectId],
            { project: updatedProject },
          );
          setJointValues(updatedProject.jointValues || {});
          setEditorCode(updatedProject.code || '');
        } else if (parsed.type === 'pose_updated') {
          const nextValues = parsed.payload as Record<string, number>;
          setJointValues({ ...nextValues });
        } else if (parsed.type === 'assistant_message') {
          const msg = parsed.payload as ChatMessage;
          queryClient.setQueryData<{ project: ProjectDetail }>(
            ['studio', 'project', projectId],
            (old) =>
              old
                ? {
                    project: {
                      ...old.project,
                      messages: [...old.project.messages, msg],
                    },
                  }
                : undefined,
          );
        } else if (parsed.type === 'done') {
          setIsProcessing(false);
          setActiveSteps([]);
        }
      } catch {
        // Ignore malformed event
      }
    };

    return () => {
      es.close();
    };
  }, [
    projectId,
    appendActiveStep,
    queryClient,
    setActiveSteps,
    setIsProcessing,
    setJointValues,
    updateActiveStep,
  ]);

  const sendPromptMutation = useMutation({
    mutationFn: (params: { prompt: string; imageBase64?: string }) =>
      studioService.sendPrompt({
        projectId: projectId!,
        prompt: params.prompt,
        imageBase64: params.imageBase64,
      }),
    onError: () => {
      setIsProcessing(false);
    },
  });

  const persistJointsMutation = useMutation({
    mutationFn: (jointValues: Record<string, number>) =>
      studioService.updateJoints({
        projectId: projectId!,
        jointValues,
      }),
  });

  const restoreRevisionMutation = useMutation({
    mutationFn: (revisionId: string) =>
      studioService.restoreRevision({
        projectId: projectId!,
        revisionId,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(['studio', 'project', projectId], res);
      setJointValues(res.project.jointValues || {});
      setEditorCode(res.project.code || '');
    },
  });

  const compileCodeMutation = useMutation({
    mutationFn: (code: string) =>
      studioService.compileDirect({
        projectId: projectId!,
        code,
        summary: 'Biên dịch trực tiếp từ trình sửa mã',
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        setCompileError(res.error || 'Lỗi biên dịch mã nguồn');
        return;
      }
      setCompileError(null);
      queryClient.setQueryData(['studio', 'project', projectId], {
        project: res.project,
      });
      setJointValues(res.project.jointValues || {});
      setCenterMode('viewport');
    },
  });

  if (!projectId) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSendMessage = (prompt: string, imageBase64?: string) => {
    if (!project) return;
    const optimisticMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt || 'Phân tích ảnh và tạo mô hình 3D tương ứng.',
      imageUrl: imageBase64,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<{ project: ProjectDetail }>(
      ['studio', 'project', projectId],
      (old) =>
        old
          ? {
              project: {
                ...old.project,
                referenceImageUrl:
                  imageBase64 || old.project.referenceImageUrl,
                messages: [...old.project.messages, optimisticMsg],
              },
            }
          : undefined,
    );

    setActiveSteps([]);
    setIsProcessing(true);
    sendPromptMutation.mutate({ prompt, imageBase64 });
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-3 lg:px-4">
        <div className="flex items-center gap-2.5">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-zinc-800 bg-zinc-900 px-2.5 text-xs lg:hidden"
              >
                <SlidersHorizontal className="mr-1.5 size-3.5" />
                Thông số
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-zinc-800 bg-zinc-950 p-0"
            >
              <SheetTitle className="sr-only">Thông số mô hình</SheetTitle>
              {project && (
                <InspectorPanel
                  joints={project.joints}
                  parts={project.parts}
                  dimensions={project.dimensions}
                  revisions={project.revisions}
                  currentVersion={project.modelVersion}
                  onPersistJoints={(vals) => persistJointsMutation.mutate(vals)}
                  onRestoreRevision={(revId) =>
                    restoreRevisionMutation.mutate(revId)
                  }
                />
              )}
            </SheetContent>
          </Sheet>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <img
              src="/trivox_logo.png"
              alt="Trivox"
              className="h-5 w-5 object-contain"
            />
            <span className="hidden sm:inline font-medium text-zinc-200">
              Dự án
            </span>
          </Link>

          <span className="text-zinc-700">/</span>

          <span className="text-sm font-medium text-zinc-100 truncate max-w-[220px] sm:max-w-xs">
            {project?.title || 'Đang tải dự án...'}
          </span>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-1">
            <button
              type="button"
              onClick={() => setCenterMode('viewport')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                centerMode === 'viewport'
                  ? 'bg-zinc-100 font-medium text-zinc-950'
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
              }`}
            >
              <Cuboid className="size-3.5" />
              <span>Không gian 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setCenterMode('code')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                centerMode === 'code'
                  ? 'bg-zinc-100 font-medium text-zinc-950'
                  : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
              }`}
            >
              <Code2 className="size-3.5" />
              <span>Mã nguồn mô hình</span>
            </button>
          </div>

          {centerMode === 'viewport' && (
            <div className="flex items-center gap-1 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-1">
              {CAMERA_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => triggerCameraPreset(p.id)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    cameraPreset.id === p.id
                      ? 'bg-zinc-100 font-medium text-zinc-950'
                      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {project?.blendUrl && (
            <a
              href={project.blendUrl}
              download={`${project.title || project.id}.blend`}
              className="hidden md:inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-zinc-800 bg-zinc-900/70 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Download className="mr-1.5 size-3.5" />
                Tải .blend
              </Button>
            </a>
          )}

          {project?.glbUrl && (
            <a
              href={project.glbUrl}
              download={`${project.title || project.id}.glb`}
              className="hidden sm:inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-zinc-800 bg-zinc-900/70 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <Download className="mr-1.5 size-3.5" />
                Tải GLB
              </Button>
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            title={user?.email || 'Đăng xuất'}
            className="h-8 px-2.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <LogOut className="size-3.5" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="h-8 px-2.5 text-xs lg:hidden"
              >
                <MessageSquare className="mr-1.5 size-3.5" />
                Trợ lý
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 border-zinc-800 bg-zinc-950 p-0 sm:w-96"
            >
              <SheetTitle className="sr-only">Trợ lý thiết kế</SheetTitle>
              {project && (
                <AgentChatPanel
                  messages={project.messages}
                  onSendMessage={handleSendMessage}
                />
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="grid flex-1 overflow-hidden lg:grid-cols-[288px_1fr_380px]">
        <aside className="hidden overflow-hidden border-r border-zinc-800/80 lg:block">
          {project && (
            <InspectorPanel
              joints={project.joints}
              parts={project.parts}
              dimensions={project.dimensions}
              revisions={project.revisions}
              currentVersion={project.modelVersion}
              onPersistJoints={(vals) => persistJointsMutation.mutate(vals)}
              onRestoreRevision={(revId) =>
                restoreRevisionMutation.mutate(revId)
              }
            />
          )}
        </aside>

        <main className="relative flex flex-1 flex-col overflow-hidden bg-zinc-950">
          {centerMode === 'code' ? (
            <div className="flex h-full flex-col bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                <span className="text-xs text-zinc-400">
                  Mã nguồn tham số của mô hình hiện tại (Phiên bản v
                  {project?.modelVersion || 1})
                </span>
                <Button
                  size="sm"
                  disabled={compileCodeMutation.isPending}
                  onClick={() => compileCodeMutation.mutate(editorCode)}
                  className="h-7 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium gap-1.5"
                >
                  <Play className="size-3" />
                  <span>
                    {compileCodeMutation.isPending
                      ? 'Đang biên dịch...'
                      : 'Biên dịch & Lưu phiên bản'}
                  </span>
                </Button>
              </div>
              {compileError && (
                <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300">
                  {compileError}
                </div>
              )}
              <Textarea
                value={editorCode}
                onChange={(e) => setEditorCode(e.target.value)}
                spellCheck={false}
                className="flex-1 resize-none rounded-none border-0 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200 focus-visible:ring-0"
              />
            </div>
          ) : project?.glbUrl ? (
            <ViewportCanvas glbUrl={project.glbUrl} joints={project.joints} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              Đang tải mô hình 3D của dự án...
            </div>
          )}

          {centerMode === 'viewport' && (
            <>
              <div className="absolute top-3 right-3 left-3 flex items-center gap-1 overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-950/85 p-1 backdrop-blur md:hidden">
                {CAMERA_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => triggerCameraPreset(p.id)}
                    className={`shrink-0 rounded px-2.5 py-1 text-xs ${
                      cameraPreset.id === p.id
                        ? 'bg-zinc-100 font-medium text-zinc-950'
                        : 'text-zinc-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {showRefImage && project?.referenceImageUrl && (
                <div className="absolute bottom-14 left-3 z-10 w-44 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/90 shadow-lg sm:w-52">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 px-2.5 py-1.5 text-[11px] text-zinc-400">
                    <span>Ảnh tham chiếu</span>
                    <button
                      type="button"
                      onClick={() => setShowRefImage(false)}
                      className="rounded p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                  <img
                    src={project.referenceImageUrl}
                    alt="Ảnh tham chiếu"
                    className="max-h-36 w-full bg-zinc-900 object-contain"
                  />
                </div>
              )}

              <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex items-center justify-between gap-2">
                <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/85 p-1 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setWireframe(!wireframe)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                      wireframe
                        ? 'bg-zinc-100 font-medium text-zinc-950'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                  >
                    <Grid className="size-3.5" />
                    <span>Khung dây</span>
                  </button>

                  {project?.referenceImageUrl && (
                    <button
                      type="button"
                      onClick={() => setShowRefImage(!showRefImage)}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                        showRefImage
                          ? 'bg-zinc-100 font-medium text-zinc-950'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                      }`}
                    >
                      <ImageIcon className="size-3.5" />
                      <span>Ảnh mẫu</span>
                    </button>
                  )}
                </div>

                {selectedPart && (
                  <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/90 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur">
                    <span>
                      Chi tiết đang chọn:{' '}
                      <strong className="font-medium text-zinc-100">
                        {project?.parts.find((p) => p.id === selectedPart)
                          ?.label || selectedPart}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPart(null)}
                      className="text-zinc-500 hover:text-zinc-200"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="hidden overflow-hidden border-l border-zinc-800/80 lg:block">
          {project && (
            <AgentChatPanel
              messages={project.messages}
              onSendMessage={handleSendMessage}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
