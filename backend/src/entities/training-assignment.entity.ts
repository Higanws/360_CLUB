import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrainingRoutine } from './training-routine.entity';
import { TrainingAssignmentMember } from './training-assignment-member.entity';
import { TrainingAssignmentTrainer } from './training-assignment-trainer.entity';

@Entity({ name: 'training_assignment' })
export class TrainingAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  routine_id: number;

  @ManyToOne(() => TrainingRoutine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine: TrainingRoutine;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @OneToMany(() => TrainingAssignmentMember, (m) => m.assignment)
  members?: TrainingAssignmentMember[];

  @OneToMany(() => TrainingAssignmentTrainer, (t) => t.assignment)
  trainers?: TrainingAssignmentTrainer[];
}
