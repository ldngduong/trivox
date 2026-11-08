import { z } from 'zod';

export const chatPromptSchema = z.object({
  prompt: z.string().max(8000, 'Nội dung tối đa 8000 ký tự'),
  imageBase64: z.string().optional(),
});

export type ChatPromptFormValues = z.infer<typeof chatPromptSchema>;
