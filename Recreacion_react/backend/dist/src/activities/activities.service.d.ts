import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { ActivityCategory } from '../entities/activity-category.entity';
import { ActivityTrainer } from '../entities/activity-trainer.entity';
import { ActivityVideo } from '../entities/activity-video.entity';
import { GymMember } from '../entities/gym-member.entity';
import { CreateActivityCategoryDto } from './dto/create-activity-category.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
export declare class ActivitiesService {
    private readonly activities;
    private readonly categories;
    private readonly videos;
    private readonly trainers;
    private readonly members;
    constructor(activities: Repository<Activity>, categories: Repository<ActivityCategory>, videos: Repository<ActivityVideo>, trainers: Repository<ActivityTrainer>, members: Repository<GymMember>);
    listCategories(): Promise<ActivityCategory[]>;
    createCategory(dto: CreateActivityCategoryDto): Promise<ActivityCategory>;
    listActivities(): Promise<{
        id: number;
        title: string;
        category_id: number;
        category_name: string;
        description: string | null;
        difficulty_level: string;
        trainer_names: string[];
        video_count: number;
    }[]>;
    getOne(id: number): Promise<{
        id: number;
        category_id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta";
        created_at: string;
        category: {
            id: number;
            name: string;
        } | null;
        videos: {
            id: number;
            url: string;
            sort_order: number;
        }[];
        trainers: {
            member_id: number;
            first_name: string | null;
            last_name: string | null;
            username: string | null;
        }[];
    }>;
    createActivity(dto: CreateActivityDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        id: number;
        category_id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta";
        created_at: string;
        category: {
            id: number;
            name: string;
        } | null;
        videos: {
            id: number;
            url: string;
            sort_order: number;
        }[];
        trainers: {
            member_id: number;
            first_name: string | null;
            last_name: string | null;
            username: string | null;
        }[];
    }>;
    updateActivity(id: number, dto: UpdateActivityDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
        id: number;
        category_id: number;
        title: string;
        description: string | null;
        difficulty_level: "media" | "baja" | "alta";
        created_at: string;
        category: {
            id: number;
            name: string;
        } | null;
        videos: {
            id: number;
            url: string;
            sort_order: number;
        }[];
        trainers: {
            member_id: number;
            first_name: string | null;
            last_name: string | null;
            username: string | null;
        }[];
    }>;
    remove(id: number): Promise<void>;
    private serializeDetail;
    private assertCategory;
    private assertTrainerIds;
    private replaceVideos;
    private replaceTrainers;
}
