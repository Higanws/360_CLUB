import { ActivitiesService } from './activities.service';
import { CreateActivityCategoryDto } from './dto/create-activity-category.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
type JwtReq = {
    user: {
        userId: number;
        role_name: string;
    };
};
export declare class ActivitiesController {
    private readonly activities;
    constructor(activities: ActivitiesService);
    listCategories(): Promise<import("../entities/activity-category.entity").ActivityCategory[]>;
    createCategory(dto: CreateActivityCategoryDto): Promise<import("../entities/activity-category.entity").ActivityCategory>;
    list(): Promise<{
        id: number;
        title: string;
        category_id: number;
        category_name: string;
        description: string | null;
        difficulty_level: string;
        trainer_names: string[];
        video_count: number;
    }[]>;
    findOne(id: number): Promise<{
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
    create(dto: CreateActivityDto, req: JwtReq): Promise<{
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
    update(id: number, dto: UpdateActivityDto, req: JwtReq): Promise<{
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
}
export {};
