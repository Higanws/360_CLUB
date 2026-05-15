import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'specialization' })
export class Specialization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;
}
