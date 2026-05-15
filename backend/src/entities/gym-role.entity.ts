import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'gym_roles' })
export class GymRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;
}
