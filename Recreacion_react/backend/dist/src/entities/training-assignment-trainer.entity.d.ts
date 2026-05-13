import { GymMember } from './gym-member.entity';
import { TrainingAssignment } from './training-assignment.entity';
export declare class TrainingAssignmentTrainer {
    id: number;
    assignment_id: number;
    trainer_member_id: number;
    assignment: TrainingAssignment;
    trainer: GymMember;
}
