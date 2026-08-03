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
  STAFF_SPEC,
  staffHasAnySpec,
} from './staff-specialization';

export type PosCapability = 'stock_read' | 'stock_write' | 'sales';

export const POS_CAPABILITY_KEY = 'pos_capability';

export const RequirePosCapability = (cap: PosCapability) =>
  SetMetadata(POS_CAPABILITY_KEY, cap);

const CAP_SPECS: Record<PosCapability, readonly string[]> = {
  stock_read: [STAFF_SPEC.CAJERO, STAFF_SPEC.STOCK],
  stock_write: [STAFF_SPEC.STOCK],
  sales: [STAFF_SPEC.CAJERO],
};

@Injectable()
export class PosCapabilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const cap = this.reflector.getAllAndOverride<PosCapability>(
      POS_CAPABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!cap) {
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
      throw new ForbiddenException(
        'POS solo para administración o staff autorizado.',
      );
    }
    const userId = req.user?.userId;
    if (userId == null || !Number.isFinite(userId)) {
      throw new ForbiddenException('No autorizado.');
    }

    const { names } = await loadStaffSpecializationNames(this.prisma, userId);
    if (!staffHasAnySpec(names, CAP_SPECS[cap])) {
      throw new ForbiddenException(
        'Tu especialización no permite esta operación de punto de venta.',
      );
    }
    return true;
  }
}
