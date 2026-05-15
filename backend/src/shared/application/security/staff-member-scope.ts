import { ForbiddenException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { GymMember } from '../../../entities/gym-member.entity';
import {
  isAdministratorRole,
  isStaffRole,
  normalizeClubRole,
} from '../../domain/club/club-roles';

export type ClubActor = { userId: number; role_name: string };

/**
 * Staff (entrenador): solo socios con `assign_staff_mem` = su usuario.
 * Administrador: sin restricción por asignación.
 */
export function staffMustUseOwnMembersOnly(actor: ClubActor): boolean {
  return isStaffRole(actor.role_name) && !isAdministratorRole(actor.role_name);
}

export function assertStaffOwnsMember(actor: ClubActor, member: GymMember): void {
  if (!staffMustUseOwnMembersOnly(actor)) {
    return;
  }
  if (member.assign_staff_mem !== actor.userId) {
    throw new ForbiddenException(
      'Este socio no está asignado a ti como entrenador o supervisor.',
    );
  }
}

export function applyStaffMemberScope<T extends GymMember>(
  qb: SelectQueryBuilder<T>,
  actor: ClubActor,
  memberAlias: string,
): void {
  if (!staffMustUseOwnMembersOnly(actor)) {
    return;
  }
  qb.andWhere(`${memberAlias}.assign_staff_mem = :staffActorId`, {
    staffActorId: actor.userId,
  });
}

export function assertAdministrator(actor: ClubActor): void {
  if (!isAdministratorRole(actor.role_name)) {
    throw new ForbiddenException(
      'Esta función es solo para administradores del club.',
    );
  }
}
