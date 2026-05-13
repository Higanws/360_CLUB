import type { Response } from 'express';
import { RunInstallDto, TestDbDto } from './dto/install.dto';
import { InstallService } from './install.service';
export declare class InstallController {
    private readonly install;
    constructor(install: InstallService);
    status(): {
        installed: boolean;
    };
    dbCheck(): Promise<{
        ok: boolean;
        message: string;
    }>;
    testDb(dto: TestDbDto): Promise<import("./install.service").TestConnectionResult>;
    run(dto: RunInstallDto): Promise<{
        success: true;
        message: string;
        adminUsername: string;
    }>;
    runStream(dto: RunInstallDto, res: Response): Promise<void>;
}
