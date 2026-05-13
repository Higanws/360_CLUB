import { RunInstallDto, TestDbDto } from './dto/install.dto';
import { InstallSchemaService } from './install-schema.service';
export type InstallProgressEvent = {
    step: string;
    message: string;
};
export type TestConnectionResult = {
    ok: true;
    currentDatabase: string;
    mysqlUser: string;
    appliedCredentialsSummary: string;
    matchesExpectedDatabase: boolean;
} | {
    ok: false;
    error: string;
    hint?: string;
};
export declare class InstallService {
    private readonly installSchema;
    private readonly logger;
    constructor(installSchema: InstallSchemaService);
    assertNotInstalled(): void;
    private verifyMvpInstallation;
    private seedMvpPath;
    private syncAutoIncrement;
    private truncateAllMvpTables;
    testConnection(dto: TestDbDto): Promise<TestConnectionResult>;
    pingProjectDefaults(): Promise<{
        ok: boolean;
        message: string;
    }>;
    run(dto: RunInstallDto, onProgress?: (e: InstallProgressEvent) => void): Promise<{
        success: true;
        message: string;
        adminUsername: string;
    }>;
}
