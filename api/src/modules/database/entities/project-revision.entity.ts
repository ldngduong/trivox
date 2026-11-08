import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity.js';
import type {
  JointMeta,
  ModelDimensions,
  PartMeta,
} from '../../agent/interfaces/agent-session.interface.js';

@Entity({ name: 'project_revisions', schema: 'app' })
export class ProjectRevisionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => ProjectEntity, (project) => project.revisions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'varchar', length: 255 })
  summary!: string;

  @Column({ type: 'text' })
  code!: string;

  @Column({ name: 'glb_key', type: 'varchar', length: 512, nullable: true })
  glbKey!: string | null;

  @Column({ name: 'glb_url', type: 'text', nullable: true })
  glbUrl!: string | null;

  @Column({ name: 'blend_key', type: 'varchar', length: 512, nullable: true })
  blendKey!: string | null;

  @Column({ name: 'blend_url', type: 'text', nullable: true })
  blendUrl!: string | null;

  @Column({
    type: 'jsonb',
    default: () => `'{"width":0,"depth":0,"height":0}'`,
  })
  dimensions!: ModelDimensions;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  joints!: JointMeta[];

  @Column({ type: 'jsonb', default: () => `'[]'` })
  parts!: PartMeta[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
