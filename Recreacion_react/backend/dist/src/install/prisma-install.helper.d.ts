import type { Connection } from 'mysql2/promise';
export declare function buildPrismaDatabaseUrl(params: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}): string;
export declare function dropAllTablesInDatabase(conn: Connection): Promise<void>;
export declare function runPrismaMigrateDeploy(databaseUrl: string): Promise<void>;
