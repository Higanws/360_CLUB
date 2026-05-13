import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityCategory } from './activity-category.entity';
import { ActivityTrainer } from './activity-trainer.entity';
import { ActivityVideo } from './activity-video.entity';

@Entity({ name: 'activity' })
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ActivityCategory, (c) => c.activities, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: ActivityCategory;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** `baja` | `media` | `alta` */
  @Column({ type: 'varchar', length: 20, default: 'media' })
  difficulty_level: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @OneToMany(() => ActivityVideo, (v) => v.activity)
  videos?: ActivityVideo[];

  @OneToMany(() => ActivityTrainer, (t) => t.activity)
  trainers?: ActivityTrainer[];
}
