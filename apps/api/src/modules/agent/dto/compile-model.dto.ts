import { IsOptional, IsString, MinLength } from 'class-validator';

export class CompileModelDto {
  @IsString()
  projectId!: string;

  @IsString()
  @MinLength(10)
  code!: string;

  @IsOptional()
  @IsString()
  summary?: string;
}
