import { DataSource } from 'typeorm';
export declare class HealthController {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    database(): Promise<{
        ok: boolean;
        driver: string;
        database: string | Uint8Array<ArrayBufferLike> | null;
        smoke: {
            gymMemberCount: number;
            adminId1Username: string | null;
            adminPasswordHashLen: number | null;
            adminBcryptPrefixOk: boolean;
        } | null;
    }>;
}
