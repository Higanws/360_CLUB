import { GymMember } from './gym-member.entity';
import { TrainingAssignment } from './training-assignment.entity';
export declare class TrainingAssignmentMember {
    id: number;
    assignment_id: number;
    member_id: number;
    assignment: TrainingAssignment;
    member: GymMember;
}
