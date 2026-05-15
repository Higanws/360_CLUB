import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Activity } from './activity.entity';

@Entity({ name: 'activity_category' })
export class ActivityCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @OneToMany(() => Activity, (a) => a.category)
  activities?: Activity[];
}
