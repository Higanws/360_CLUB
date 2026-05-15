import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { GymMember } from './gym-member.entity';
import { TrainingAssignment } from './training-assignment.entity';

@Entity({ name: 'training_assignment_member' })
@Unique('uk_training_assignment_member', ['assignment_id', 'member_id'])
export class TrainingAssignmentMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  assignment_id: number;

  @Column({ type: 'int' })
  member_id: number;

  @ManyToOne(() => TrainingAssignment, (a) => a.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: TrainingAssignment;

  @ManyToOne(() => GymMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: GymMember;
}
