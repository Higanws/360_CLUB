import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'gym_member_class' })
export class GymMemberClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  member_id: number | null;

  @Column({ type: 'int', nullable: true })
  assign_class: number | null;
}
