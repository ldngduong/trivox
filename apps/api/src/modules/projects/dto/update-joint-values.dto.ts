import { IsObject } from 'class-validator';

export class UpdateJointValuesDto {
  @IsObject()
  jointValues!: Record<string, number>;
}
