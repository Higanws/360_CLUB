import { Repository } from 'typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
export declare class SettingsController {
    private readonly settings;
    constructor(settings: Repository<GeneralSetting>);
    branding(): Promise<{
        name: string;
        gym_logo: string | null;
        left_header: string;
        footer: string;
        header_color: string;
        currency: string;
    }>;
}
