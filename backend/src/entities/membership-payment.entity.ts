import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'membership_payment' })
export class MembershipPayment {
  @PrimaryGeneratedColumn({ name: 'mp_id' })
  mp_id: number;

  @Column({ type: 'int', nullable: true })
  member_id: number | null;

  @Column({ type: 'int', nullable: true })
  membership_id: number | null;

  @Column({ type: 'double precision', nullable: true })
  membership_amount: number | null;

  @Column({ type: 'double precision', nullable: true })
  paid_amount: number | null;

  @Column({ type: 'date', nullable: true })
  start_date: Date | string | null;

  @Column({ type: 'date', nullable: true })
  end_date: Date | string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  membership_status: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payment_status: string | null;

  @Column({ type: 'date', nullable: true })
  created_date: Date | string | null;

  @Column({ type: 'int', nullable: true })
  created_by: number | null;
}
