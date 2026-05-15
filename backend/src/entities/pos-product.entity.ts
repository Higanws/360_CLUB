import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'pos_product' })
export class PosProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sku: string | null;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'double', default: 0 })
  unit_price: number;

  @Column({ type: 'int', default: 0 })
  stock_qty: number;

  /** 1 = visible en venta, 0 = oculto */
  @Column({ type: 'tinyint', default: 1 })
  active: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at: Date;
}
