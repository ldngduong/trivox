import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(2, 'Tên dự án tối thiểu 2 ký tự')
    .max(150, 'Tên dự án tối đa 150 ký tự'),
  prompt: z.string().max(2000).optional(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const promptFormSchema = z.object({
  prompt: z.string().max(4000),
});

export type PromptFormValues = z.infer<typeof promptFormSchema>;
