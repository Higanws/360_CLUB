import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './activity.entity';

@Entity({ name: 'activity_video' })
export class ActivityVideo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Activity, (a) => a.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ type: 'varchar', length: 800 })
  url: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;
}
