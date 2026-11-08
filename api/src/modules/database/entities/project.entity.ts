import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity.js';
import type { ProjectRevisionEntity } from './project-revision.entity.js';
import type { ProjectMessageEntity } from './project-message.entity.js';
import type {
  JointMeta,
  ModelDimensions,
  PartMeta,
} from '../../agent/interfaces/agent-session.interface.js';

@Entity({ name: 'projects', schema: 'app' })
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 32, default: 'ready' })
  status!: 'draft' | 'generating' | 'ready' | 'failed';

  @Column({ name: 'current_code', type: 'text', default: '' })
  currentCode!: string;

  @Column({ name: 'model_version', type: 'int', default: 1 })
  modelVersion!: number;

  @Column({ name: 'glb_key', type: 'varchar', length: 512, nullable: true })
  glbKey!: string | null;

  @Column({ name: 'glb_url', type: 'text', nullable: true })
  glbUrl!: string | null;

  @Column({ name: 'blend_key', type: 'varchar', length: 512, nullable: true })
  blendKey!: string | null;

  @Column({ name: 'blend_url', type: 'text', nullable: true })
  blendUrl!: string | null;

  @Column({
    name: 'reference_image_key',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  referenceImageKey!: string | null;

  @Column({ name: 'reference_image_url', type: 'text', nullable: true })
  referenceImageUrl!: string | null;

  @Column({
    type: 'jsonb',
    default: () => `'{"width":0,"depth":0,"height":0}'`,
  })
  dimensions!: ModelDimensions;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  joints!: JointMeta[];

  @Column({ type: 'jsonb', default: () => `'[]'` })
  parts!: PartMeta[];

  @Column({ name: 'joint_values', type: 'jsonb', default: () => `'{}'` })
  jointValues!: Record<string, number>;

  @OneToMany('ProjectRevisionEntity', 'project')
  revisions!: ProjectRevisionEntity[];

  @OneToMany('ProjectMessageEntity', 'project')
  messages!: ProjectMessageEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
