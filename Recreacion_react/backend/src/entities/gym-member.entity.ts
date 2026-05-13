import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'gym_member' })
export class GymMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  activated: number | null;

  @Column({ type: 'text', nullable: true })
  role_name: string | null;

  @Column({ type: 'text', nullable: true })
  member_id: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  di_dni_type: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  di_dni_number: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  middle_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string | null;

  @Column({ type: 'text', nullable: true })
  member_type: string | null;

  /** FK a gym_roles.id (rol interno del club: Yoga, etc.). Distinto de role_name. */
  @Column({ type: 'int', nullable: true, name: 'role' })
  role: number | null;

  /** IDs de specialization en JSON, p.ej. ["1","2"]. */
  @Column({ type: 'text', nullable: true })
  s_specialization: string | null;

  @Column({ type: 'text', nullable: true })
  gender: string | null;

  @Column({ type: 'date', nullable: true })
  birth_date: Date | string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  zipcode: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  image: string | null;

  @Column({ type: 'int', nullable: true })
  assign_staff_mem: number | null;

  @Column({ type: 'int', nullable: true })
  intrested_area: number | null;

  @Column({ type: 'int', nullable: true })
  g_source: number | null;

  @Column({ type: 'int', nullable: true })
  referrer_by: number | null;

  @Column({ type: 'date', nullable: true })
  inquiry_date: Date | string | null;

  @Column({ type: 'date', nullable: true })
  trial_end_date: Date | string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  selected_membership: string | null;

  @Column({ type: 'text', nullable: true })
  membership_status: string | null;

  @Column({ type: 'date', nullable: true })
  membership_valid_from: Date | string | null;

  @Column({ type: 'date', nullable: true })
  membership_valid_to: Date | string | null;

  @Column({ type: 'date', nullable: true })
  first_pay_date: Date | string | null;

  @Column({ type: 'int', nullable: true })
  created_by: number | null;

  @Column({ type: 'date', nullable: true })
  created_date: Date | string | null;

  /** Peso corporal (kg). */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physical_weight_kg: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physical_height_cm: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physical_chest_cm: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physical_waist_cm: string | null;

  /** Muslo (cm). */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physical_thigh_cm: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physical_arms_cm: string | null;

  /** % grasa corporal. */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  physical_fat_percent: string | null;
}
