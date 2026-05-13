import { Activity } from './activity.entity';
import { TrainingRoutine } from './training-routine.entity';
export declare class TrainingRoutineActivity {
    id: number;
    routine_id: number;
    activity_id: number;
    sort_order: number;
    weight_kg: number | null;
    weekdays_mask: number;
    routine: TrainingRoutine;
    activity: Activity;
}
