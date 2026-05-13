import { Activity } from './activity.entity';
import { GymMember } from './gym-member.entity';
export declare class ActivityTrainer {
    id: number;
    activity_id: number;
    trainer_member_id: number;
    activity: Activity;
    member: GymMember;
}
