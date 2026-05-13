import { Repository } from 'typeorm';
import { GymMember } from '../entities/gym-member.entity';
import { TrainingAssignment } from '../entities/training-assignment.entity';
import { TrainingAssignmentMember } from '../entities/training-assignment-member.entity';
import { TrainingAssignmentTrainer } from '../entities/training-assignment-trainer.entity';
import { TrainingRoutine } from '../entities/training-routine.entity';
import { CreateTrainingAssignmentDto } from './dto/create-training-assignment.dto';
export declare class TrainingAssignmentsService {
    private readonly assignments;
    private readonly assignmentMembers;
    private readonly assignmentTrainers;
    private readonly routines;
    private readonly members;
    constructor(assignments: Repository<TrainingAssignment>, assignmentMembers: Repository<TrainingAssignmentMember>, assignmentTrainers: Repository<TrainingAssignmentTrainer>, routines: Repository<TrainingRoutine>, members: Repository<GymMember>);
    list(): Promise<{
        id: number;
        routine_id: number;
        routine_title: string;
        member_ids: number[];
        member_names: string[];
        trainer_names: string[];
        created_at: string;
    }[]>;
    getOne(id: number): Promise<{
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
    create(dto: CreateTrainingAssignmentDto, actor: {
        userId: number;
        role_name: string;
    }): Promise<{
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
    private assertMembers;
    private assertTrainers;
}
