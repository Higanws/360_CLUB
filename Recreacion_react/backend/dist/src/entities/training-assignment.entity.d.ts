import { TrainingRoutine } from './training-routine.entity';
import { TrainingAssignmentMember } from './training-assignment-member.entity';
import { TrainingAssignmentTrainer } from './training-assignment-trainer.entity';
export declare class TrainingAssignment {
    id: number;
    routine_id: number;
    routine: TrainingRoutine;
    created_at: Date;
    members?: TrainingAssignmentMember[];
    trainers?: TrainingAssignmentTrainer[];
}
