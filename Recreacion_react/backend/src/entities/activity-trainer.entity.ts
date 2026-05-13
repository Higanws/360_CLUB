import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './activity.entity';
import { GymMember } from './gym-member.entity';

@Entity({ name: 'activity_trainer' })
export class ActivityTrainer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  activity_id: number;

  @Column({ type: 'int' })
  trainer_member_id: number;

  @ManyToOne(() => Activity, (a) => a.trainers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => GymMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_member_id' })
  member: GymMember;
}
