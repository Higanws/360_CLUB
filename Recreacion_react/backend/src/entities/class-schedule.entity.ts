import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'class_schedule' })
export class ClassSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  class_name: string | null;
}
