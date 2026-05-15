import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'membership' })
export class Membership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  membership_label: string | null;

  @Column({ type: 'double precision', nullable: true })
  membership_amount: number | null;

  @Column({ type: 'int', nullable: true })
  membership_period_days: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  installment_plan: string | null;

  @Column({ type: 'double precision', nullable: true })
  signup_fee: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  image: string | null;
}
