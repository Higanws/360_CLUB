import { CreateTrainingAssignmentDto } from './dto/create-training-assignment.dto';
import { TrainingAssignmentsService } from './training-assignments.service';
type JwtReq = {
    user: {
        userId: number;
        role_name: string;
    };
};
export declare class TrainingAssignmentsController {
    private readonly assignments;
    constructor(assignments: TrainingAssignmentsService);
    list(): Promise<{
        id: number;
        routine_id: number;
        routine_title: string;
        member_ids: number[];
        member_names: string[];
        trainer_names: string[];
        created_at: string;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        routine_id: number;
        routine_title: string;
        member_ids: number[];
        trainer_member_ids: number[];
        members: {
            member_id: number;
            first_name: string | null;
            last_name: string | null;
            username: string | null;
        }[];
        trainers: {
            trainer_member_id: number;
            first_name: string | null;
            last_name: string | null;
            username: string | null;
        }[];
        created_at: string;
    }>;
    create(dto: CreateTrainingAssignmentDto, req: JwtReq): Promise<{
        id: number;
        routine_id: number;
        routine_title: string;
        member_ids: number[];
        trainer_member_ids: number[];
        members: {
            member_id: number;
            first_name: string | null;
            last_name: string | null;
            username: string | null;
        }[];
        trainers: {
            trainer_member_id: number;
            first_name: string | null;
            last_name: string | null;
            username: string | null;
        }[];
        created_at: string;
    }>;
    remove(id: number): Promise<void>;
}
export {};
