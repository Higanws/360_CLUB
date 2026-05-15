import type { ValueTransformer } from 'typeorm';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { GymMember } from './gym-member.entity';

export const routineSnapshotLongtextTransformer: ValueTransformer = {
  to: (v: unknown) => {
    if (v == null) return null;
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  },
  from: (v: unknown) => {
    if (v == null || v === '') return null;
    if (typeof v === 'object' && v !== null && !Buffer.isBuffer(v)) {
      return v as Record<string, unknown>;
    }
    const s = Buffer.isBuffer(v) ? v.toString('utf8') : String(v);
    const t = s.trim();
    if (!t) return null;
    try {
      const p = JSON.parse(t) as unknown;
      return typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  },
};

@Entity({ name: 'member_weekly_routine' })
@Unique('member_weekly_routine_member_id_week_start_key', ['member_id', 'week_start'])
export class MemberWeeklyRoutine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  member_id: number;

  @ManyToOne(() => GymMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: GymMember;

  @Column({ type: 'date' })
  week_start: Date | string;

  @Column({
    type: 'longtext',
    nullable: true,
    transformer: routineSnapshotLongtextTransformer,
  })
  routine_snapshot_json: Record<string, unknown> | null;

  @UpdateDateColumn({ type: 'datetime', precision: 0 })
  updated_at: Date;
}
