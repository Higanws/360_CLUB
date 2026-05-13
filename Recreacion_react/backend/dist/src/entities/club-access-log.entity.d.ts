import { GymMember } from './gym-member.entity';
export declare class ClubAccessLog {
    id: number;
    member_id: number | null;
    access_date: string;
    access_at: Date;
    staff_actor_id: number;
    outcome: string;
    status_display: string | null;
    lookup_raw: string | null;
    due_date_snapshot: Date | string | null;
    days_remaining: number | null;
    days_overdue: number | null;
    member?: GymMember | null;
    staffActor?: GymMember;
}
