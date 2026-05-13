import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'business_roles';

/** Roles que pueden gestionar el módulo de socios (no clientes). */
export const BusinessRoles = () =>
  SetMetadata(ROLES_KEY, ['administrator', 'staff_member']);
