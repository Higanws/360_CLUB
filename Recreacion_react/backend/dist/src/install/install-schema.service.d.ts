import type { Connection } from 'mysql2/promise';
export declare class InstallSchemaService {
    private readonly logger;
    schemaFilePath(): string;
    splitSqlStatements(sql: string): string[];
    executeSqlScript(conn: Connection, sql: string): Promise<void>;
    applyFullSchema(conn: Connection): Promise<void>;
}
