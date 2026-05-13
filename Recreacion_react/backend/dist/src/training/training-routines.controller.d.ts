import { CreateTrainingRoutineDto } from './dto/create-training-routine.dto';
import { UpdateTrainingRoutineDto } from './dto/update-training-routine.dto';
import { TrainingRoutinesService } from './training-routines.service';
export declare class TrainingRoutinesController {
    private readonly routines;
    constructor(routines: TrainingRoutinesService);
    list(): Promise<{
        id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta" | "mixta";
        exercise_count: number;
        created_at: string;
    }[]>;
    findOne(id: number): Promise<{
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
}
