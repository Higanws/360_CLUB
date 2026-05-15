import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'general_setting' })
export class GeneralSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  gym_logo: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  left_header: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  footer: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  header_color: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  currency: string | null;

  @Column({ type: 'int', nullable: true })
  member_can_view_other: number | null;

  @Column({ type: 'int', nullable: true })
  staff_can_view_own_member: number | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  date_format: string | null;
}
