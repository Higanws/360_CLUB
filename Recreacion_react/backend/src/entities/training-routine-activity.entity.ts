import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Activity } from './activity.entity';
import { TrainingRoutine } from './training-routine.entity';

@Entity({ name: 'training_routine_activity' })
@Unique('uk_training_routine_activity', ['routine_id', 'activity_id'])
export class TrainingRoutineActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  routine_id: number;

  @Column({ type: 'int' })
  activity_id: number;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  /** Peso sugerido en kg para este ejercicio dentro de la rutina (opcional). */
  @Column({ type: 'double', nullable: true })
  weight_kg: number | null;

  /**
   * Días en los que aplica el ejercicio (bitmask Lun–Dom: 1,2,4,8,16,32,64).
   * 127 = todos; mínimo 1 (al menos un día).
   */
  @Column({ type: 'int', unsigned: true, default: 127 })
  weekdays_mask: number;

  @ManyToOne(() => TrainingRoutine, (r) => r.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routine_id' })
  routine: TrainingRoutine;

  @ManyToOne(() => Activity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;
}
