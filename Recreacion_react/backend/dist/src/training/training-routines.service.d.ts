import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { TrainingRoutine } from '../entities/training-routine.entity';
import { TrainingRoutineActivity } from '../entities/training-routine-activity.entity';
import { CreateTrainingRoutineDto } from './dto/create-training-routine.dto';
import { UpdateTrainingRoutineDto } from './dto/update-training-routine.dto';
export declare class TrainingRoutinesService {
    private readonly routines;
    private readonly lines;
    private readonly activities;
    constructor(routines: Repository<TrainingRoutine>, lines: Repository<TrainingRoutineActivity>, activities: Repository<Activity>);
    list(): Promise<{
        id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta" | "mixta";
        exercise_count: number;
        created_at: string;
    }[]>;
    getOne(id: number): Promise<{
        id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta" | "mixta";
        created_at: string;
        activity_ids: number[];
        exercises: {
            activity_id: number;
            weight_kg: number | null;
            weekdays_mask: number;
            title: string;
            difficulty_level: "media" | "baja" | "alta";
            category_name: string;
        }[];
    }>;
    create(dto: CreateTrainingRoutineDto): Promise<{
        id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta" | "mixta";
        created_at: string;
        activity_ids: number[];
        exercises: {
            activity_id: number;
            weight_kg: number | null;
            weekdays_mask: number;
            title: string;
            difficulty_level: "media" | "baja" | "alta";
            category_name: string;
        }[];
    }>;
    update(id: number, dto: UpdateTrainingRoutineDto): Promise<{
        id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta" | "mixta";
        created_at: string;
        activity_ids: number[];
        exercises: {
            activity_id: number;
            weight_kg: number | null;
            weekdays_mask: number;
            title: string;
            difficulty_level: "media" | "baja" | "alta";
            category_name: string;
        }[];
    }>;
    remove(id: number): Promise<void>;
    private normalizeLines;
    private computeDifficultyForOrderedIds;
    private replaceLines;
}
