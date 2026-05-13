import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class AdministratorRoleGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
