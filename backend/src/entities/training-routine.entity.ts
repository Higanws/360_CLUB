import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrainingRoutineActivity } from './training-routine-activity.entity';

@Entity({ name: 'training_routine' })
export class TrainingRoutine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** `baja` | `media` | `alta` si todos los ejercicios coinciden; `mixta` si hay más de un nivel. */
  @Column({ type: 'varchar', length: 20, default: 'media' })
  difficulty_level: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @OneToMany(() => TrainingRoutineActivity, (l) => l.routine)
  lines?: TrainingRoutineActivity[];
}
