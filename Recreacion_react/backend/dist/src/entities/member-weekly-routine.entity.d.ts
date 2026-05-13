import type { ValueTransformer } from 'typeorm';
import { GymMember } from './gym-member.entity';
export declare const routineSnapshotLongtextTransformer: ValueTransformer;
export declare class MemberWeeklyRoutine {
    id: number;
    member_id: number;
    member: GymMember;
    week_start: Date | string;
    routine_snapshot_json: Record<string, unknown> | null;
    updated_at: Date;
}
