import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Reflector } from '@nestjs/core';
import { normalizeClubRole } from '../../domain/club/club-roles';
import {
  loadStaffSpecializationNames,
  staffHasAnySpec,
} from './staff-specialization';

export const STAFF_SPECS_KEY = 'staff_required_specs';

/** Admin siempre pasa; staff necesita al menos una de las especializaciones (por nombre). */
export const RequireStaffSpecs = (...specNames: string[]) =>
  SetMetadata(STAFF_SPECS_KEY, specNames);

@Injectable()
export class StaffSpecializationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(STAFF_SPECS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      user?: { userId?: number; role_name?: string };
    }>();
    const role = normalizeClubRole(req.user?.role_name);
    if (role === 'administrator') {
      return true;
    }
    if (role !== 'staff_member') {
      throw new ForbiddenException('No autorizado.');
    }
    const userId = req.user?.userId;
    if (userId == null || !Number.isFinite(userId)) {
      throw new ForbiddenException('No autorizado.');
    }

    const { names } = await loadStaffSpecializationNames(this.prisma, userId);
    if (!staffHasAnySpec(names, required)) {
      throw new ForbiddenException(
        'Tu especialización no permite esta operación.',
      );
    }
    return true;
  }
}
