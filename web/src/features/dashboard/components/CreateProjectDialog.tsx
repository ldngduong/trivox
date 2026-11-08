import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  createProjectSchema,
  type CreateProjectFormValues,
} from '@/schemas/studio.schema';
import { createNewProject } from '@/services/studio.service';
import { readFileAsDataUrl } from '@/utils/file.util';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      prompt: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: createNewProject,
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      reset();
      setAttachedImage(null);
      onOpenChange(false);
      navigate(`/studio/${res.project.id}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setAttachedImage(dataUrl);
  };

  const onSubmit = (values: CreateProjectFormValues) => {
    createMutation.mutate({
      title: values.title,
      prompt: values.prompt,
      imageBase64: attachedImage || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-zinc-100">
            Tạo dự án 3D mới
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Nhập tên dự án, tải ảnh tham chiếu (nếu có) và mô tả yêu cầu để hệ thống khởi tạo mô hình.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title" className="text-xs text-zinc-300">
                Tên dự án
              </FieldLabel>
              <Input
                id="title"
                placeholder="Ví dụ: Ghế công thái học có khớp ngả lưng"
                className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
                {...register('title')}
              />
              {errors.title && (
                <FieldError className="text-xs text-zinc-400">
                  {errors.title.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel className="text-xs text-zinc-300">
                Ảnh tham chiếu (tùy chọn)
              </FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {attachedImage ? (
                <div className="relative rounded-md border border-zinc-800 bg-zinc-950 p-2 flex items-center justify-center">
                  <img
                    src={attachedImage}
                    alt="Tham chiếu"
                    className="max-h-40 object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-2 right-2 h-6 w-6 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-zinc-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 rounded-md border border-dashed border-zinc-800 bg-zinc-950/60 hover:bg-zinc-950 hover:border-zinc-700 flex flex-col items-center justify-center gap-1.5 text-xs text-zinc-400 transition-colors"
                >
                  <ImagePlus className="h-4 w-4 text-zinc-300" />
                  <span>Bấm để chọn ảnh sản phẩm hoặc bản vẽ</span>
                </button>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="prompt" className="text-xs text-zinc-300">
                Mô tả yêu cầu thiết kế
              </FieldLabel>
              <Textarea
                id="prompt"
                placeholder="Mô tả kích thước tổng thể, chất liệu, màu sắc và các bộ phận cần khớp chuyển động..."
                className="min-h-[90px] bg-zinc-950 border-zinc-800 text-zinc-100 text-xs resize-none"
                {...register('prompt')}
              />
              {errors.prompt && (
                <FieldError className="text-xs text-zinc-400">
                  {errors.prompt.message}
                </FieldError>
              )}
            </Field>
          </FieldGroup>

          {createMutation.isError && (
            <p className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : 'Không thể khởi tạo dự án'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium"
            >
              {createMutation.isPending
                ? 'Đang khởi tạo mô hình...'
                : 'Khởi tạo và mở Studio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
