import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class MembershipAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
