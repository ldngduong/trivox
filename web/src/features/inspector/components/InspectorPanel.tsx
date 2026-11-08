import React from 'react';
import {
  Eye,
  EyeOff,
  History,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudioUiStore } from '@/stores/studio-ui.store';
import type {
  JointMeta,
  ModelDimensions,
  PartMeta,
  ProjectRevisionSummary,
} from '@/types/studio.types';
import {
  buildOpenAllJointValues,
  buildResetJointValues,
} from '@/utils/joint.util';

interface InspectorPanelProps {
  joints: JointMeta[];
  parts: PartMeta[];
  dimensions: ModelDimensions;
  revisions: ProjectRevisionSummary[];
  currentVersion: number;
  onPersistJoints?: (nextValues: Record<string, number>) => void;
  onRestoreRevision?: (revisionId: string) => void;
}

export function InspectorPanel({
  joints,
  parts,
  dimensions,
  revisions,
  currentVersion,
  onPersistJoints,
  onRestoreRevision,
}: InspectorPanelProps) {
  const jointValues = useStudioUiStore((s) => s.jointValues);
  const setJointValues = useStudioUiStore((s) => s.setJointValues);
  const updateJointValue = useStudioUiStore((s) => s.updateJointValue);
  const autoSpin = useStudioUiStore((s) => s.autoSpin);
  const setAutoSpin = useStudioUiStore((s) => s.setAutoSpin);
  const spinRpm = useStudioUiStore((s) => s.spinRpm);
  const setSpinRpm = useStudioUiStore((s) => s.setSpinRpm);
  const hiddenParts = useStudioUiStore((s) => s.hiddenParts);
  const togglePartVisibility = useStudioUiStore((s) => s.togglePartVisibility);
  const selectedPart = useStudioUiStore((s) => s.selectedPart);
  const setSelectedPart = useStudioUiStore((s) => s.setSelectedPart);

  const handleOpenAll = () => {
    const next = buildOpenAllJointValues(joints);
    setJointValues(next);
    onPersistJoints?.(next);
  };

  const handleResetAll = () => {
    setAutoSpin(false);
    const next = buildResetJointValues(joints);
    setJointValues(next);
    onPersistJoints?.(next);
  };

  const hasContinuousJoint = joints.some((j) => j.type === 'continuous');

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-100">
            Thông số mô hình
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400 tabular-nums">
            {dimensions.width} × {dimensions.depth} × {dimensions.height} mm
          </p>
        </div>
        <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300">
          v{currentVersion}
        </span>
      </div>

      <Tabs
        defaultValue="joints"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="px-3 pt-3">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
            <TabsTrigger value="joints" className="text-xs">
              Khớp ({joints.length})
            </TabsTrigger>
            <TabsTrigger value="parts" className="text-xs">
              Chi tiết ({parts.length})
            </TabsTrigger>
            <TabsTrigger value="revisions" className="text-xs">
              Phiên bản ({revisions.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="joints"
          className="mt-0 flex flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenAll}
                  className="h-8 text-xs"
                >
                  Mở toàn bộ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAll}
                  className="h-8 border-zinc-800 bg-transparent text-xs hover:bg-zinc-900"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Đặt lại
                </Button>
              </div>

              <Separator className="bg-zinc-800/80" />

              {joints.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-500">
                  Mô hình hiện tại chưa khai báo khớp chuyển động.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {joints.map((j) => {
                    const currentVal = jointValues[j.id] ?? j.default ?? 0;
                    return (
                      <div key={j.id} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300">{j.label}</span>
                          <span className="text-zinc-400 tabular-nums">
                            {Math.round(currentVal)}
                            {j.unit === 'mm' ? ' mm' : j.unit}
                          </span>
                        </div>
                        <Slider
                          min={j.min}
                          max={j.max}
                          step={1}
                          value={[currentVal]}
                          onValueChange={(vals) => {
                            if (vals[0] !== undefined) {
                              updateJointValue(j.id, vals[0]);
                            }
                          }}
                          onValueCommit={(vals) => {
                            if (vals[0] !== undefined) {
                              onPersistJoints?.({
                                ...jointValues,
                                [j.id]: vals[0],
                              });
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {hasContinuousJoint && (
                <>
                  <Separator className="bg-zinc-800/80" />
                  <div className="flex flex-col gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-200">
                        Quay tự động trục liên tục
                      </span>
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {spinRpm} vòng/phút
                      </span>
                    </div>
                    <Button
                      variant={autoSpin ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setAutoSpin(!autoSpin)}
                      className="h-8 w-full text-xs"
                    >
                      {autoSpin ? (
                        <>
                          <Pause className="mr-1.5 size-3.5" />
                          Dừng quay
                        </>
                      ) : (
                        <>
                          <Play className="mr-1.5 size-3.5" />
                          Chạy thử chuyển động quay
                        </>
                      )}
                    </Button>
                    {autoSpin && (
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>Tốc độ quay</span>
                          <span className="tabular-nums">
                            {spinRpm} vòng/phút
                          </span>
                        </div>
                        <Slider
                          min={200}
                          max={1400}
                          step={50}
                          value={[spinRpm]}
                          onValueChange={(vals) => {
                            if (vals[0] !== undefined) {
                              setSpinRpm(vals[0]);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="parts"
          className="mt-0 flex flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="flex-1 px-3 py-3">
            <div className="flex flex-col gap-1">
              {parts.map((part) => {
                const isHidden = Boolean(hiddenParts[part.id]);
                const isSelected = selectedPart === part.id;
                return (
                  <div
                    key={part.id}
                    className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPart(isSelected ? null : part.id)
                      }
                      className="flex-1 truncate text-left"
                    >
                      {part.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePartVisibility(part.id)}
                      className="ml-2 rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                      title={isHidden ? 'Hiện chi tiết' : 'Ẩn chi tiết'}
                    >
                      {isHidden ? (
                        <EyeOff className="size-3.5 text-zinc-600" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="revisions"
          className="mt-0 flex flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="flex-1 px-3 py-3">
            <div className="flex flex-col gap-2">
              {revisions.map((rev) => {
                const isActive = rev.version === currentVersion;
                return (
                  <div
                    key={rev.id}
                    className={`rounded-md border p-2.5 text-xs space-y-2 ${
                      isActive
                        ? 'border-zinc-700 bg-zinc-900'
                        : 'border-zinc-800/80 bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-200">
                        Phiên bản v{rev.version}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {rev.partsCount} chi tiết • {rev.jointsCount} khớp
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {rev.summary}
                    </p>
                    {!isActive && onRestoreRevision && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestoreRevision(rev.id)}
                        className="h-7 w-full border-zinc-800 bg-zinc-900 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        <History className="mr-1.5 size-3" />
                        Khôi phục phiên bản này
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
