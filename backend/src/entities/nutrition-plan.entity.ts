import type { ValueTransformer } from 'typeorm';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GymMember } from './gym-member.entity';
import {
  parseMealsScheduleJson,
  stringifyMealsScheduleJson,
  type NutritionScheduleSlot,
} from '../nutrition/schedule-json.util';

const mealsScheduleLongtextTransformer: ValueTransformer = {
  to: (v: NutritionScheduleSlot[] | null | undefined) =>
    stringifyMealsScheduleJson(v),
  from: (v: unknown) => {
    const slots = parseMealsScheduleJson(v);
    return slots.length ? slots : null;
  },
};

@Entity({ name: 'nutrition_plan' })
export class NutritionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  member_id: number;

  @OneToOne(() => GymMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: GymMember;

  @Column({ type: 'date', nullable: true })
  valid_from: Date | string | null;

  @Column({ type: 'date', nullable: true })
  valid_to: Date | string | null;

  @Column({
    type: 'longtext',
    nullable: true,
    transformer: mealsScheduleLongtextTransformer,
  })
  meals_schedule_json: NutritionScheduleSlot[] | null;

  @Column({ type: 'datetime', nullable: true })
  created_at: Date | null;
}
