import { IsOptional, IsString } from 'class-validator';

export class SendPromptDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsString()
  imageBase64?: string;
}
