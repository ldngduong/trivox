import React, { useState } from 'react';
import { AlertCircle, Check, ChevronRight, Loader2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ToolStep } from '@/types/studio.types';

interface StepItemProps {
  step: ToolStep;
}

export function StepItem({ step }: StepItemProps) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(step.detail && step.detail.trim());

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border border-zinc-800/80 bg-zinc-900/50">
        <CollapsibleTrigger
          disabled={!hasDetail}
          className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900 disabled:cursor-default"
        >
          <div className="flex min-w-0 items-center gap-2">
            {step.status === 'running' && (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-zinc-300" />
            )}
            {step.status === 'completed' && (
              <Check className="size-3.5 shrink-0 text-zinc-300" />
            )}
            {step.status === 'error' && (
              <AlertCircle className="size-3.5 shrink-0 text-zinc-400" />
            )}
            <span className="truncate">{step.label}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-zinc-500">
            {step.elapsedMs !== undefined && step.status !== 'running' && (
              <span className="tabular-nums">
                {(step.elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
            {hasDetail && (
              <ChevronRight
                className={`size-3.5 transition-transform ${
                  open ? 'rotate-90' : ''
                }`}
              />
            )}
          </div>
        </CollapsibleTrigger>
        {hasDetail && (
          <CollapsibleContent>
            <div className="border-t border-zinc-800/80 bg-zinc-950/80 px-2.5 py-2">
              <pre className="max-h-48 overflow-auto text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap">
                {step.detail}
              </pre>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
