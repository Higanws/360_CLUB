import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { GymMember } from '../entities/gym-member.entity';
import { LoginDto } from './dto/login.dto';
export type SafeUser = Omit<GymMember, 'password'>;
export interface JwtPayload {
    sub: number;
    username: string;
    role_name: string;
    kind: 'access' | 'refresh';
}
export declare class AuthService {
    private readonly members;
    private readonly jwt;
    private readonly config;
    private readonly logger;
    constructor(members: Repository<GymMember>, jwt: JwtService, config: ConfigService);
    sanitize(member: GymMember): SafeUser;
    assertMemberMayLogin(member: GymMember): void;
    private parseJwtTtlSeconds;
    private todayUtcDateString;
    validateCredentials(dto: LoginDto): Promise<GymMember>;
    login(dto: LoginDto): Promise<{
        user: SafeUser;
        accessToken: string;
        refreshToken: string;
    }>;
    issueTokens(member: GymMember): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getProfile(userId: number): Promise<SafeUser>;
}
