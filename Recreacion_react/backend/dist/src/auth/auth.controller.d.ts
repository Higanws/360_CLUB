import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        user: import("./auth.service").SafeUser;
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    me(req: {
        user: {
            userId: number;
        };
    }): Promise<import("./auth.service").SafeUser>;
}
