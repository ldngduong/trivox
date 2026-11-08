import React, { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, SendHorizontal, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { QUICK_PROMPTS } from '@/constants/studio.constants';
import {
  type ChatPromptFormValues,
  chatPromptSchema,
} from '@/schemas/chat.schema';
import { useStudioUiStore } from '@/stores/studio-ui.store';
import type { ChatMessage } from '@/types/studio.types';
import { readFileAsDataUrl } from '@/utils/file.util';
import { StepItem } from './StepItem';

interface AgentChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, imageBase64?: string) => void;
}

export function AgentChatPanel({
  messages,
  onSendMessage,
}: AgentChatPanelProps) {
  const activeSteps = useStudioUiStore((s) => s.activeSteps);
  const isProcessing = useStudioUiStore((s) => s.isProcessing);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, watch, setValue, reset } =
    useForm<ChatPromptFormValues>({
      resolver: zodResolver(chatPromptSchema),
      defaultValues: {
        prompt: '',
        imageBase64: undefined,
      },
    });

  const promptVal = watch('prompt');
  const attachedImage = watch('imageBase64');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSteps, isProcessing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setValue('imageBase64', dataUrl);
    e.target.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const dataUrl = await readFileAsDataUrl(file);
          setValue('imageBase64', dataUrl);
        }
      }
    }
  };

  const onSubmit = (values: ChatPromptFormValues) => {
    const trimmed = values.prompt.trim();
    if ((!trimmed && !values.imageBase64) || isProcessing) return;
    onSendMessage(trimmed, values.imageBase64);
    reset({ prompt: '', imageBase64: undefined });
  };

  const handleQuickPrompt = (text: string) => {
    if (isProcessing) return;
    onSendMessage(text);
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-100">Trợ lý thiết kế</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Tải ảnh tham chiếu hoặc nhập yêu cầu chỉnh sửa
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-2">
              {msg.role === 'user' ? (
                <div className="ml-6 flex flex-col items-end gap-2">
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Ảnh đính kèm"
                      className="max-h-36 rounded-lg border border-zinc-800 bg-zinc-900 object-contain"
                    />
                  )}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-100">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="mr-2 flex flex-col gap-2">
                  {msg.steps && msg.steps.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {msg.steps.map((st) => (
                        <StepItem key={st.id} step={st} />
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-zinc-800/60 bg-zinc-950 px-3 py-2.5 text-xs leading-relaxed text-zinc-200">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="mr-2 flex flex-col gap-1.5">
              {activeSteps.length > 0 ? (
                activeSteps.map((st) => <StepItem key={st.id} step={st} />)
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-zinc-800/80 bg-zinc-900/50 px-2.5 py-2 text-xs text-zinc-400">
                  <Loader2 className="size-3.5 animate-spin text-zinc-300" />
                  <span>Đang xử lý yêu cầu...</span>
                </div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex flex-wrap gap-1.5 border-t border-zinc-900 px-3 pt-2.5">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isProcessing}
            onClick={() => handleQuickPrompt(q)}
            className="rounded-md border border-zinc-800/90 bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 focus-within:border-zinc-700">
          {attachedImage && (
            <div className="relative mb-2 inline-block">
              <img
                src={attachedImage}
                alt="Xem trước"
                className="h-16 rounded border border-zinc-700 object-cover"
              />
              <button
                type="button"
                onClick={() => setValue('imageBase64', undefined)}
                className="absolute -top-1.5 -right-1.5 rounded-full border border-zinc-700 bg-zinc-900 p-0.5 text-zinc-300 hover:bg-zinc-800"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          <Textarea
            {...register('prompt')}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(onSubmit)();
              }
            }}
            placeholder="Nhập yêu cầu chỉnh sửa hoặc dán ảnh mẫu (Ctrl+V)..."
            className="min-h-16 resize-none border-0 bg-transparent px-1 py-1 text-xs text-zinc-100 shadow-none focus-visible:ring-0"
          />

          <div className="mt-1.5 flex items-center justify-between border-t border-zinc-800/70 pt-2">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <ImagePlus className="mr-1.5 size-3.5" />
                Đính kèm ảnh
              </Button>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isProcessing || (!promptVal?.trim() && !attachedImage)}
              className="h-7 px-3 text-xs"
            >
              Gửi
              <SendHorizontal className="ml-1.5 size-3.5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
