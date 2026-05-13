import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'pos_sale' })
export class PosSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'double' })
  total_amount: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'int', nullable: true })
  created_by: number | null;

  @Column({ type: 'varchar', length: 32, default: 'efectivo' })
  payment_method: string;
}
