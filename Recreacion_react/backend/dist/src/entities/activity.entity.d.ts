import { ActivityCategory } from './activity-category.entity';
import { ActivityTrainer } from './activity-trainer.entity';
import { ActivityVideo } from './activity-video.entity';
export declare class Activity {
    id: number;
    category: ActivityCategory;
    title: string;
    description: string | null;
    difficulty_level: string;
    created_at: Date;
    videos?: ActivityVideo[];
    trainers?: ActivityTrainer[];
}
