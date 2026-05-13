import { TrainingRoutineActivity } from './training-routine-activity.entity';
export declare class TrainingRoutine {
    id: number;
    title: string;
    description: string | null;
    difficulty_level: string;
    created_at: Date;
    lines?: TrainingRoutineActivity[];
}
