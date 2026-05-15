import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GymMember } from './gym-member.entity';

@Entity({ name: 'club_access_log' })
export class ClubAccessLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  member_id: number | null;

  @Column({ type: 'date' })
  access_date: string;

  @Column({ type: 'datetime' })
  access_at: Date;

  @Column({ type: 'int' })
  staff_actor_id: number;

  @Column({ type: 'varchar', length: 40 })
  outcome: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  status_display: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  lookup_raw: string | null;

  @Column({ type: 'date', nullable: true })
  due_date_snapshot: Date | string | null;

  @Column({ type: 'int', nullable: true })
  days_remaining: number | null;

  @Column({ type: 'int', nullable: true })
  days_overdue: number | null;

  @ManyToOne(() => GymMember, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'member_id' })
  member?: GymMember | null;

  @ManyToOne(() => GymMember, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'staff_actor_id' })
  staffActor?: GymMember;
}
