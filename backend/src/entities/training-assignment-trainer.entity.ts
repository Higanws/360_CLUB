import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { GymMember } from './gym-member.entity';
import { TrainingAssignment } from './training-assignment.entity';

@Entity({ name: 'training_assignment_trainer' })
@Unique('uk_training_assignment_trainer', ['assignment_id', 'trainer_member_id'])
export class TrainingAssignmentTrainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  assignment_id: number;

  @Column({ type: 'int' })
  trainer_member_id: number;

  @ManyToOne(() => TrainingAssignment, (a) => a.trainers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: TrainingAssignment;

  @ManyToOne(() => GymMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_member_id' })
  trainer: GymMember;
}
