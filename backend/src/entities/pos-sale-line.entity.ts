import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pos_sale_line' })
export class PosSaleLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  sale_id: number;

  @Column({ type: 'int' })
  product_id: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'double' })
  unit_price: number;

  @Column({ type: 'double' })
  line_total: number;
}
